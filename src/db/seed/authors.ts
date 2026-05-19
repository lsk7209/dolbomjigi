export const authorsSeedData = [
  {
    slug: 'editor-team',
    name: '돌봄지기 편집팀',
    role: '운영자',
    credentials_json: JSON.stringify([]),
    bio_short: '돌봄지기 편집팀은 시니어 돌봄로봇과 복지 정책을 전문적으로 다루는 콘텐츠 팀입니다.',
    avatar_url: null,
  },
  {
    slug: 'social-worker-reviewer',
    name: '김복지',
    role: '감수자',
    credentials_json: JSON.stringify([
      { type: '사회복지사 1급', issuer: '보건복지부', year: 2015 },
      { type: '노인복지 전문 경력', issuer: '○○노인복지관', year: '10년' },
    ]),
    bio_short: '현직 사회복지사로 노인 돌봄 현장에서 10년 이상 근무하며 돌봄로봇 도입 경험을 보유하고 있습니다.',
    avatar_url: null,
  },
];
