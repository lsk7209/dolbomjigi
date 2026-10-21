import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import AuthorBlock from '../src/components/common/AuthorBlock';
import PricingTable from '../src/components/robot/PricingTable';
import { buildArticleJsonLd, buildProductJsonLd } from '../src/lib/jsonld';
import { lintContent } from '../src/lib/content-linter';
import { comparisonSummary } from '../src/lib/product-evidence';

test('missing price is never free or zero', () => {
  const html=renderToStaticMarkup(<PricingTable rentalAvailable={false}/>);
  assert.doesNotMatch(html,/0원|무료|무상/);
});
test('rental alone never asserts subsidy', () => {
  assert.doesNotMatch(renderToStaticMarkup(<PricingTable rentalAvailable/>),/무료 또는 저렴|지원사업 통해/);
});
test('unverified reviewer is not certified and passed legacy date is not source evidence', () => {
  const html=renderToStaticMarkup(<AuthorBlock author={{name:'편집팀',role:'편집',slug:'editorial-team'}} reviewer={{name:'김복지',credentials:'사회복지사 1급',slug:'reviewer'}} confirmedAt="2026-10-20"/>);
  assert.doesNotMatch(html,/김복지|사회복지사|최종 확인일:.*2026/);
  assert.match(html,/\/authors\/editor-team/);
});
test('subscription alone does not emit incomplete aggregate offer', () => {
  const ld=buildProductJsonLd({id:1,slug:'x',name_ko:'x',manufacturer:'x',category:'companion',subscription_monthly:10000});
  assert.equal('offers' in ld,false);
});
test('editorial team is Organization and missing dates omitted', () => {
  const ld=buildArticleJsonLd({title:'x',description:'x',authorName:'돌봄지기 편집팀',url:'https://dolbomjigi.ehon365.kr/guide/x',datePublished:'',dateModified:''}) as Record<string,unknown>;
  assert.equal((ld.author as Record<string,unknown>)['@type'],'Organization');
  assert.equal('dateModified' in ld,false);
});
test('normal negative medical explanation allowed',()=>assert.equal(lintContent('이 제품은 의료기기가 아닙니다. 치료 효과를 보장하지 않습니다.').ok,true));
test('quoted unsupported medical efficacy still requires review',()=>assert.equal(lintContent('<blockquote>치매 예방과 치료 효과가 보장됩니다.</blockquote>').ok,false));
test('negation in same sentence does not hide a positive efficacy claim',()=>assert.equal(lintContent('의료기기가 아니지만 치매 예방 효과가 보장됩니다.').ok,false));
test('direct treatment and diagnosis claims require medical review',()=>{
  assert.equal(lintContent('이 로봇은 치매를 치료합니다.').ok,false);
  assert.equal(lintContent('의료기기로 질환을 진단합니다.').ok,false);
});

test('unverified comparison summary never repeats stored model feature claims',()=>{
  const shown=comparisonSummary('hyodol-vs-dasom-k');
  assert.match(shown,/대조하기 전/);
  assert.doesNotMatch(shown,/이동형|생활패턴 특화|추천/);
});
