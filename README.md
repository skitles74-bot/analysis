# ERP 데이터 분석 대시보드 & 자동 보고서

ERP CSV 4종(상품·고객·주문·주문상세)을 업로드하면 경영 KPI 대시보드가 생성되고, Gemini 2.5 AI가 분석 보고서를 작성합니다. 보고서는 PDF / Word(.docx)로 다운로드할 수 있습니다.

## 기능

- **CSV 업로드 & 즉시 유효성 검사** — 컬럼·타입·중복 PK·FK 참조·금액 일치 검증
- **경영 KPI 대시보드** — 매출, 주문, TOP 상품, 지역/카테고리/등급별 분석
- **Gemini 2.5 AI 분석 보고서** — gemini-2.5-flash 기반, 경영 요약·발견사항·개선 제안·리스크 경고
- **PDF / DOCX 다운로드** — 표·차트 포함

## 시작하기

```bash
cd work/analysis
npm install
cp .env.example .env.local
# .env.local에 GEMINI_API_KEY 설정
npm run dev
```

브라우저에서 http://localhost:3000 접속

업로드 화면에서 **「샘플 CSV 불러오기」** 버튼으로 `sample-data/` 폴더의 4개 파일을 한 번에 로드할 수 있습니다.

## CSV 파일 형식

| 슬롯 | 샘플 파일 | 필수 컬럼 |
|------|-----------|-----------|
| 상품 | `sample-data/products.csv` | product_id, product_name, category, brand, unit_cost_krw, unit_price_krw, stock_qty, status |
| 고객 | `sample-data/customers.csv` | customer_id, customer_name, customer_type, city, phone, email, join_date, tier |
| 주문 | `sample-data/sales_orders.csv` | order_no, customer_id, order_date, status, channel, payment_method, total_amount_krw |
| 주문상세 | `sample-data/sales_order_items.csv` | order_item_id, order_no, product_id, qty, unit_price_krw, discount_pct, amount_krw |

## 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `GEMINI_API_KEY` | AI 보고서용 | [Google AI Studio](https://aistudio.google.com/apikey)에서 발급 |

## 기술 스택

Next.js 15 · React 19 · TypeScript · Zod · PapaParse · Recharts · jsPDF · docx · Gemini 2.5 REST API

## 사용 흐름

1. **메인 (/)** — CSV 4종 업로드 및 유효성 검사
2. **대시보드** — 상단 메뉴 → KPI 카드 및 6종 차트
3. **보고서** — 상단 메뉴 → AI 보고서 생성 → PDF/DOCX 다운로드
4. **원본데이터** — 상단 메뉴 → 업로드된 CSV 4종 테이블 조회 (페이지네이션)
