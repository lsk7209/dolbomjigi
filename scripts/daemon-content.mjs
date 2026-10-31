/**
 * 돌봄지기 무인 자율 발행 및 콘텐츠 동기화 데몬 (Dolbomjigi Autonomous Content Daemon)
 *
 * 기능:
 * 1. 상주형 무인 백그라운드 루프 (--daemon 플래그)
 * 2. 주기별(기본 6시간) 자동 Wake-up 및 버퍼/큐 동기화
 * 3. output/dolbomjigi/new-content/ 신규 생성 패키지 무결성 검증
 * 4. content-linter 의료 금지어/과장 표현 0건 검증
 * 5. publication-approvals.json 신규 발행 승인 및 contentVersion 해시 등록
 * 6. src/db/seed/blog_posts.ts 시드 동기화 상태 점검
 * 7. logs/daemon-dolbom.log 파일에 전 주기 상세 감사 로그 기록
 *
 * 사용법:
 *   node scripts/daemon-content.mjs --daemon --interval-hours 6
 *   (단발 1회 실행: node scripts/daemon-content.mjs)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { runAutoPipeline } from './auto-daily-content.mjs';
import { runDeepReview } from './deep-review.mjs';

const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'daemon-dolbom.log');

// 로그 디렉터리 준비
fs.mkdirSync(LOG_DIR, { recursive: true });

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function log(message, level = 'INFO') {
  const line = `[${timestamp()}] [${level}] ${message}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch {
    // ignore logging failure
  }
}

function autoGitPush(totalPosts) {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (!status) {
      log('ℹ️ Git 작업 트리가 최신 상태입니다. 원격 동기화를 유지합니다.');
      return;
    }

    log('📦 신규 발행 및 갱신 사항 감지. 배포 전 단위 테스트 수행...');
    execSync('pnpm test', { stdio: 'pipe' });

    log('🚀 변경 사항 스테이징 및 커밋 생성...');
    execSync('git add -A', { stdio: 'pipe' });
    const msg = `feat(auto-daemon): publish & sync ${totalPosts} verified posts`;
    execSync(`git commit -m "${msg}"`, { stdio: 'pipe' });

    log('🌐 GitHub origin main 자동 푸시 실행...');
    execSync('git push origin main', { stdio: 'pipe' });
    log('🎉 [배포 완료] GitHub 푸시 완료. OVH 자동 배포 파이프라인 가동.');
  } catch (err) {
    log(`⚠️ 자동 푸시 중 오류 발생 (로컬 작업 보존): ${err.message}`, 'WARN');
  }
}

async function executeCycle() {
  log('================================================================');
  log('🚀 돌봄지기 무인 자율 데몬 사이클 시작 (Dolbomjigi Daemon Wake-up)');
  log('================================================================');

  try {
    // 1단계: 일일 자동 생성 및 승인 파이프라인
    await runAutoPipeline();

    // 2단계: 다각도 심층 리뷰 및 무결성 검증 (Self-Review Loop)
    log('🔍 [자율 리뷰 단계] 전체 콘텐츠 및 사이트 무결성 다각도 검토 가동');
    const reviewResult = await runDeepReview();

    log(`📊 [리뷰 감사 요약] 검토 대상: ${reviewResult.totalPosts}건 | 금지어: ${reviewResult.lintIssues.length}건 | 결함 링크: ${reviewResult.brokenInternalBlogLinks.length}건 | 승인 해시 오류: ${reviewResult.approvalHashMismatches.length}건`);

    if (reviewResult.lintIssues.length === 0 && reviewResult.brokenInternalBlogLinks.length === 0 && reviewResult.approvalHashMismatches.length === 0) {
      log('🎉 [리뷰 통과] 모든 콘텐츠 및 사이트 무결성 기준을 100% 충족하여 안전하게 승인 상태를 유지합니다.');
      // 3단계: GitHub 자동 푸시 및 OVH 자동 배포 트리거
      autoGitPush(reviewResult.totalPosts);
    } else {
      log('⚠️ [리뷰 알림] 미달 항목이 감지되어 다음 사이클에서 보완을 재시도합니다.', 'WARN');
    }

    log('✅ 이번 주기 자율 파이프라인 및 자가 리뷰 완료');
  } catch (err) {
    log(`❌ 사이클 실행 중 오류 발생: ${err instanceof Error ? err.stack : String(err)}`, 'ERROR');
  }
}

async function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function main() {
  const args = process.argv.slice(2);
  const isDaemon = args.includes('--daemon');
  
  let intervalHours = 6;
  const intervalIdx = args.indexOf('--interval-hours');
  if (intervalIdx !== -1 && args[intervalIdx + 1]) {
    const parsed = Number(args[intervalIdx + 1]);
    if (!Number.isNaN(parsed) && parsed > 0) {
      intervalHours = parsed;
    }
  }

  log(`🤖 돌봄지기 무인 데몬 엔진 초기화 (모드: ${isDaemon ? '상주형 데몬' : '단발 실행'})`);
  if (isDaemon) {
    log(`⏰ 자동 실행 주기: ${intervalHours}시간마다 자율 실행 (${intervalHours * 3600}초)`);
  }

  // Graceful shutdown
  let isRunning = true;
  process.on('SIGINT', () => {
    log('⚠️ SIGINT 신호 수신. 데몬을 안전하게 종료합니다.');
    isRunning = false;
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    log('⚠️ SIGTERM 신호 수신. 데몬을 안전하게 종료합니다.');
    isRunning = false;
    process.exit(0);
  });

  if (!isDaemon) {
    await executeCycle();
    log('🎉 단발 실행 완료. 프로세스를 종료합니다.');
    return;
  }

  // 데몬 루프
  let cycleCount = 1;
  while (isRunning) {
    log(`🔄 [Cycle #${cycleCount}] 무인 자동 작업 수행 시작`);
    await executeCycle();

    const sleepSec = intervalHours * 3600;
    log(`💤 다음 자동 실행까지 ${intervalHours}시간(${sleepSec}초) 동안 절전 대기합니다...`);

    // 30초 단위로 나누어 대기 (빠른 종료 대응)
    const steps = Math.ceil(sleepSec / 30);
    for (let i = 0; i < steps; i++) {
      if (!isRunning) break;
      await sleep(30);
    }

    cycleCount++;
  }
}

main().catch((err) => {
  log(`🚨 데몬 치명적 오류로 비정상 종료: ${err}`, 'FATAL');
  process.exit(1);
});
