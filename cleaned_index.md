# Vite + React 프로젝트 구조 및 실행 흐름 분석 보고서

## 1. 애플리케이션 진입점 및 실행 흐름

본 프로젝트는 표준 Vite + React 앱의 실행 흐름을 따릅니다.

1.  **`index.html` (Public Root)**
    *   웹 애플리케이션의 최초 진입점입니다.
    *   `<head>` 태그에는 메타 정보, SEO 태그, 폰트 preload, 그리고 초기 로딩 화면을 위한 간단한 스타일이 포함되어 있습니다.
    *   `<body>` 태그 안의 `<div id="root"></div>`가 React 애플리케이션이 렌더링될 마운트 지점입니다.
    *   가장 마지막에 `<script type="module" src="/src/main.jsx"></script>`를 통해 React 앱의 메인 스크립트를 로드합니다.

2.  **`src/main.jsx` (React 초기화)**
    *   React 애플리케이션을 초기화하고 `index.html`의 `#root` 엘리먼트에 렌더링하는 역할을 합니다.
    *   `ReactDOM.createRoot()`를 사용하여 React 18의 동시성 모드(Concurrent Mode)를 활성화합니다.
    *   `ClerkProvider`로 전체 앱을 감싸서 인증(Authentication) 기능을 제공합니다.
    *   최상위 컴포넌트인 `<App />`을 렌더링합니다.

3.  **`src/App.jsx` (메인 애플리케이션 컴포넌트)**
    *   애플리케이션의 최상위 레이아웃과 라우팅을 담당합니다.
    *   `react-router-dom`을 사용하여 페이지 간의 라우팅을 설정합니다. (`/`, `/tools`, `/prompts` 등)
    *   `Zustand`를 사용한 `useAuthStore`를 통해 전역 상태(로그인 여부, 사용자 정보 등)를 관리합니다.
    *   `React.lazy`와 `<Suspense>`를 활용하여 주요 컴포넌트(AIToolsGrid, PromptLauncher 등)를 코드 스플리팅(Code Splitting)하여 초기 로딩 성능을 최적화합니다.
    *   인증 및 결제 관련 모달(`SimpleAuthModal`, `PaymentModal`)을 전역적으로 관리합니다.

## 2. Vite 설정 (`vite.config.js`) 분석

Vite 설정 파일은 프로젝트의 빌드 및 개발 환경을 최적화하는 데 중요한 역할을 합니다.

*   **Alias (경로 별칭)**
    *   `resolve.alias`: `@`를 `src` 디렉토리의 절대 경로로 매핑합니다.
    *   **예시**: `import MyComponent from '@/components/MyComponent.jsx'`와 같이 사용하여 상대 경로(`../../`)의 복잡성을 줄입니다.

*   **Build-time Chunking (빌드 시 청크 분할 전략)**
    *   `build.rollupOptions.output.manualChunks`: 공통 라이브러리나 기능별로 코드를 분할하여 별도의 파일(청크)로 만듭니다.
    *   **주요 청크:**
        *   `react-vendor`: `react`, `react-dom` 등 핵심 React 라이브러리
        *   `radix-core`, `radix-extended`: Radix UI 라이브러리
        *   `routing-state`: `react-router-dom`, `zustand` 등 라우팅 및 상태 관리
        *   `services`: `@supabase/supabase-js` 등 외부 서비스
    *   **효과**: 초기 로딩 시 필요한 코드만 다운로드하게 하여 페이지 로딩 속도를 향상시킵니다. 사용자가 특정 페이지에 접근할 때만 해당 페이지에 필요한 코드 청크를 동적으로 로드합니다.

## 3. 주요 폴더 역할 정리

`src` 디렉토리 내의 폴더들은 기능별로 코드를 체계적으로 관리하기 위해 다음과 같이 구성되어 있습니다.

*   **`src/components`**:
    *   **역할**: 재사용 가능한 공통 UI 컴포넌트들을 모아놓은 곳입니다. (예: `Button`, `Avatar`, `NavigationBar`)
    *   이 폴더의 컴포넌트들은 특정 비즈니스 로직에 종속되지 않고, 여러 페이지나 기능에서 공통으로 사용됩니다.

*   **`src/features`**:
    *   **역할**: 애플리케이션의 특정 기능(도메인)과 관련된 컴포넌트, 로직, 상태 관리를 그룹화한 곳입니다.
    *   **예시**: `auth` (인증), `payment` (결제), `prompt-launcher` (프롬프트 실행기) 등.
    *   각 feature 폴더는 자체적으로 컴포넌트, 훅, 상태 관리 로직을 포함할 수 있어 기능 단위로 독립적인 개발 및 관리가 용이합니다.

*   **`src/utils`**:
    *   **역할**: 프로젝트 전반에서 사용되는 순수 함수나 유틸리티 함수들을 모아놓은 곳입니다.
    *   **예시**: `serviceWorker.js` (서비스 워커 등록), 날짜 포맷팅, 데이터 변환 등 특정 프레임워크나 UI에 종속되지 않는 함수들.

*   **`src/store`**:
    *   **역할**: `Zustand`를 사용한 전역 상태 관리 로직이 위치합니다. `authStore.js`가 대표적이며, 사용자 인증 상태를 관리합니다.

*   **`src/pages`**:
    *   **역할**: 특정 라우트(URL)에 매핑되는 페이지 레벨의 컴포넌트입니다. 여러 컴포넌트와 feature를 조합하여 하나의 페이지를 구성합니다.

## 4. 향후 유지보수를 위한 핵심 진입점

새로운 기능을 추가하거나 기존 UI/기능을 수정할 때 다음 위치를 중심으로 작업을 시작하면 효율적입니다.

*   **공통 UI 요소 수정/추가**:
    *   **위치**: `src/components/`
    *   네비게이션 바, 버튼, 카드 등 앱 전반에 사용되는 UI를 수정할 때 이 폴더의 관련 컴포넌트를 찾습니다.

*   **특정 기능(예: 프롬프트 실행기) 수정/추가**:
    *   **위치**: `src/features/prompt-launcher/`
    *   해당 기능과 관련된 UI, 상태, API 호출 로직이 모두 이 폴더 안에 응집되어 있으므로 여기서부터 분석하고 수정하는 것이 좋습니다.

*   **새로운 페이지 추가**:
    1.  **`src/pages`**: 새로운 페이지 컴포넌트 파일을 생성합니다.
    2.  **`src/App.jsx`**: `Routes` 내에 새로운 `<Route>`를 추가하여 페이지 컴포넌트와 URL을 연결합니다. 필요 시 `React.lazy`를 사용하여 동적 로딩을 적용합니다.

*   **전역 상태(예: 사용자 정보) 변경**:
    *   **위치**: `src/store/authStore.js`
    *   Zustand 스토어의 상태나 액션을 수정하여 전역 데이터 흐름을 변경합니다.

*   **API 연동 (Supabase 등)**:
    *   **위치**: `src/services` 또는 각 `features` 폴더 내의 API 관련 파일
    *   Supabase 클라이언트 설정 및 데이터 통신 관련 로직을 관리합니다.