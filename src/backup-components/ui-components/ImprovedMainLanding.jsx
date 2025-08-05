import { Smartphone, CheckCircle, Zap, Award, Rocket } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import InteractiveHub from './InteractiveHub';

const ImprovedMainLanding = ({ onNavigateToPrompts }) => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Hero Section - 고급 스펙 적용 */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden bg-gradient-to-br from-primary-600 via-[#4f28ff] to-primary-900">
        {/* 노이즈 텍스처 오버레이 */}
        <div className={`absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')]`}></div>
        
        {/* 고급 플로팅 요소들 */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-accent-500/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-primary-100/30 rounded-full blur-xl"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column - 텍스트 콘텐츠 */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-6">
                <h1 className="font-display text-display-xl font-semibold text-neutral-0 leading-tight animate-in slide-in-from-bottom-4 duration-700">
                  <span className="block bg-gradient-to-r from-accent-500 to-primary-100 bg-clip-text text-transparent">
                    답답한 AI
                  </span>
                  <span className="block text-neutral-0">
                    클릭 한번으로 완벽한 대답을 얻어보세요
                  </span>
                </h1>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-6 animate-in slide-in-from-bottom-6 duration-700 delay-200">
                <Button 
                  size="lg" 
                  className="bg-white/10 backdrop-blur-lg hover:bg-white/20 text-neutral-0 px-12 py-6 rounded-lg border border-white/20 text-body-lg font-semibold shadow-glass hover:shadow-elev transition-all duration-300 transform hover:scale-105" 
                  onClick={() => document.getElementById('interactive-hub').scrollIntoView({ behavior: 'smooth' })}
                >
                  무료 시작하기
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-white/30 text-neutral-0 hover:bg-white/10 px-8 py-6 rounded-lg text-body-lg font-medium backdrop-blur-md transition-all duration-300"
                >
                  3분 데모 보기
                </Button>
              </div>
            </div>

            {/* Right Column - 목업 이미지 */}
            <div className="flex justify-center lg:justify-end animate-in slide-in-from-right-8 duration-700 delay-300">
              <div className="relative group">
                <img 
                  src="/images/mockup.png" 
                  alt="이지픽 AI 도구 플랫폼 미리보기" 
                  className="w-full max-w-lg h-auto rounded-lg shadow-glass relative z-10 transition-transform duration-500 group-hover:scale-105"
                />
                {/* 강화된 글로우 효과 */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-500/20 to-transparent rounded-lg"></div>
                <div className="absolute -inset-6 bg-gradient-to-r from-primary-500/15 to-accent-500/15 rounded-xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
                
                {/* 추가 글래스 레이어 */}
                <div className="absolute inset-0 bg-white/5 rounded-lg backdrop-blur-sm"></div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* New Interactive Section */}
      <section id="interactive-hub" className="py-32 bg-neutral-0">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-24 space-y-6">
            <h2 className="font-display text-display-lg font-semibold text-neutral-900">
              지금 바로 체험해보세요
            </h2>
            <p className="font-body text-body-lg text-neutral-700 max-w-2xl mx-auto leading-relaxed">
              몇 번의 클릭만으로 완벽한 프롬프트가 완성됩니다
            </p>
          </div>
          <InteractiveHub onNavigateToPrompts={onNavigateToPrompts} />
        </div>
      </section>

      {/* 핵심 가치 제안 섹션 */}
      <section className="py-32 bg-gradient-to-br from-neutral-50 to-primary-50/30">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-24 space-y-8">
            <h2 className="font-display text-display-lg font-semibold text-neutral-900">
              왜 <span className="text-primary-600">이지픽</span>인가요?
            </h2>
            <p className="font-body text-body-lg text-neutral-700 max-w-3xl mx-auto leading-relaxed">
              복잡한 AI 프롬프트 작성, 이제 3초면 충분합니다
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <Card className="group relative overflow-hidden bg-neutral-0/90 backdrop-blur-lg border border-neutral-200/50 shadow-glass hover:shadow-elev transition-all duration-500 transform hover:-translate-y-2">
              <CardContent className="p-12 text-center space-y-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Smartphone className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 bg-blue-400 rounded-3xl mx-auto opacity-20 group-hover:scale-125 transition-transform duration-300"></div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">3초 완성</h3>
                <p className="text-slate-600 leading-relaxed text-lg">
                  복잡한 프롬프트 작성법을 배울 필요 없이<br/>
                  <span className="font-semibold text-slate-800">몇 번의 클릭만으로 전문가급 질문 완성</span>
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-neutral-0/90 backdrop-blur-lg border border-neutral-200/50 shadow-glass hover:shadow-elev transition-all duration-500 transform hover:-translate-y-2">
              <CardContent className="p-12 text-center space-y-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 bg-emerald-400 rounded-3xl mx-auto opacity-20 group-hover:scale-125 transition-transform duration-300"></div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">검증된 품질</h3>
                <p className="text-slate-600 leading-relaxed text-lg">
                  전문가가 엄선한 템플릿으로<br/>
                  <span className="font-semibold text-slate-800">실제 성과가 입증된 프롬프트만 제공</span>
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-neutral-0/90 backdrop-blur-lg border border-neutral-200/50 shadow-glass hover:shadow-elev transition-all duration-500 transform hover:-translate-y-2">
              <CardContent className="p-12 text-center space-y-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 bg-violet-400 rounded-3xl mx-auto opacity-20 group-hover:scale-125 transition-transform duration-300"></div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">즉시 활용</h3>
                <p className="text-slate-600 leading-relaxed text-lg">
                  완성된 프롬프트를 바로 복사해서<br/>
                  <span className="font-semibold text-slate-800">원하는 AI 서비스에 즉시 사용 가능</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 성공 사례 섹션 */}
      <section className="py-32 bg-neutral-0">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-24 space-y-8">
            <h2 className="font-display text-display-lg font-semibold text-neutral-900">
              실제 사용자들의 <span className="text-primary-600">성과</span>
            </h2>
            <p className="font-body text-body-lg text-neutral-700 max-w-3xl mx-auto leading-relaxed">
              이지픽으로 더 나은 결과를 얻은 실제 사용자들의 이야기입니다
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-6 group">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-accent-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-elev">
                  <Award className="w-12 h-12 text-neutral-0" />
                </div>
                <div className="absolute inset-0 w-24 h-24 bg-accent-50 rounded-3xl mx-auto opacity-20 group-hover:scale-125 transition-transform duration-300"></div>
              </div>
              <div className="space-y-3">
                <h4 className="font-body text-body-lg font-semibold text-neutral-700">합격률 향상</h4>
                <div className="font-display text-display-md font-bold text-accent-500">78%</div>
                <p className="font-body text-body-sm text-neutral-700">기존 30%에서 2.6배 증가</p>
              </div>
            </div>
            
            <div className="text-center space-y-6 group">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-elev">
                  <div className="text-3xl text-neutral-0">⏱️</div>
                </div>
                <div className="absolute inset-0 w-24 h-24 bg-primary-50 rounded-3xl mx-auto opacity-20 group-hover:scale-125 transition-transform duration-300"></div>
              </div>
              <div className="space-y-3">
                <h4 className="font-body text-body-lg font-semibold text-neutral-700">시간 단축</h4>
                <div className="font-display text-display-md font-bold text-primary-600">90%</div>
                <p className="font-body text-body-sm text-neutral-700">평균 3시간 → 30분</p>
              </div>
            </div>
            
            <div className="text-center space-y-6 group">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-accent-500 to-accent-500 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-elev">
                  <div className="text-3xl text-neutral-0">⭐</div>
                </div>
                <div className="absolute inset-0 w-24 h-24 bg-accent-50 rounded-3xl mx-auto opacity-20 group-hover:scale-125 transition-transform duration-300"></div>
              </div>
              <div className="space-y-3">
                <h4 className="font-body text-body-lg font-semibold text-neutral-700">사용자 만족도</h4>
                <div className="font-display text-display-md font-bold text-accent-500">4.8/5</div>
                <p className="font-body text-body-sm text-neutral-700">1,847명의 평가</p>
              </div>
            </div>
            
            <div className="text-center space-y-6 group">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-elev">
                  <Rocket className="w-12 h-12 text-neutral-0" />
                </div>
                <div className="absolute inset-0 w-24 h-24 bg-primary-50 rounded-3xl mx-auto opacity-20 group-hover:scale-125 transition-transform duration-300"></div>
              </div>
              <div className="space-y-3">
                <h4 className="font-body text-body-lg font-semibold text-neutral-700">생산성 증가</h4>
                <div className="font-display text-display-md font-bold text-primary-600">250%</div>
                <p className="font-body text-body-sm text-neutral-700">업무 효율성 개선</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-48 bg-gradient-to-br from-neutral-900 via-primary-900 to-primary-900 relative overflow-hidden">
        {/* 노이즈 텍스처 오버레이 */}
        <div className={`absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E')]`}></div>
        
        {/* 고급 플로팅 요소들 */}
        <div className="absolute top-32 left-20 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-32 h-32 bg-primary-100/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-neutral-0/10 rounded-full blur-xl"></div>
        
        <div className="container mx-auto max-w-5xl px-4 text-center text-neutral-0 relative z-10">
          <div className="space-y-16">
            <div className="space-y-8">
              <h2 className="font-display text-display-xl font-semibold leading-tight">
                완벽한 프롬프트를<br/>
                <span className="bg-gradient-to-r from-accent-500 to-primary-100 bg-clip-text text-transparent">
                  지금 바로 만들어보세요
                </span>
              </h2>
              <p className="font-body text-body-lg text-neutral-0/90 max-w-3xl mx-auto leading-relaxed">
                복잡한 AI 프롬프트 작성법을 배우는 대신,<br/>
                <span className="font-semibold text-neutral-0">3초만에 전문가급 질문을 완성하세요</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-accent-500 to-primary-500 hover:from-accent-600 hover:to-primary-600 text-neutral-0 font-body text-body-lg font-bold px-20 py-8 rounded-lg shadow-glass hover:shadow-elev transition-all duration-300 transform hover:scale-105 backdrop-blur-lg" 
                onClick={() => onNavigateToPrompts()}
              >
                무료로 시작하기
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-neutral-0/30 text-neutral-0 hover:bg-neutral-0/10 font-body text-body-lg font-medium px-16 py-8 rounded-lg backdrop-blur-lg transition-all duration-300"
              >
                3분 데모 보기
              </Button>
            </div>

            <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-neutral-0/80 font-body text-body-lg">
              <div className="flex items-center justify-center space-x-4">
                <CheckCircle className="w-6 h-6 text-accent-500" />
                <span className="font-medium">회원가입 불필요</span>
              </div>
              <div className="flex items-center justify-center space-x-4">
                <CheckCircle className="w-6 h-6 text-accent-500" />
                <span className="font-medium">100% 무료 사용</span>
              </div>
              <div className="flex items-center justify-center space-x-4">
                <CheckCircle className="w-6 h-6 text-accent-500" />
                <span className="font-medium">즉시 사용 가능</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-cyan-500/20 rounded-full blur-xl"></div>
      </section>
    </div>
  )
}

export default ImprovedMainLanding