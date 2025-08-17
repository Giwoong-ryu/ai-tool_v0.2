// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Star, Users, TrendingUp, Zap, ArrowRight, Play, CheckCircle, Smartphone } from 'lucide-react'

const MainLanding = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  // 목업폰 슬라이드 자동 전환
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  // 인기 카테고리별 상위 2개씩 총 10개
  const featuredTools = [
    { id: 1, name: "ChatGPT", category: "대화형 AI", rating: 4.8, users: "1억+", icon: "💬", korean: true },
    { id: 2, name: "Claude", category: "대화형 AI", rating: 4.7, users: "5천만+", icon: "🤖", korean: true },
    { id: 3, name: "Midjourney", category: "이미지 생성", rating: 4.9, users: "2천만+", icon: "🎨", korean: false },
    { id: 4, name: "Karlo", category: "이미지 생성", rating: 4.6, users: "500만+", icon: "🖼️", korean: true },
    { id: 5, name: "뤼튼", category: "문서 작성", rating: 4.5, users: "300만+", icon: "📝", korean: true },
    { id: 6, name: "Notion AI", category: "문서 작성", rating: 4.4, users: "1천만+", icon: "📄", korean: true },
    { id: 7, name: "RunwayML", category: "영상 편집", rating: 4.6, users: "800만+", icon: "🎬", korean: false },
    { id: 8, name: "Vrew", category: "영상 편집", rating: 4.7, users: "200만+", icon: "✂️", korean: true },
    { id: 9, name: "ElevenLabs", category: "음성 처리", rating: 4.8, users: "1천만+", icon: "🎵", korean: false },
    { id: 10, name: "Otter.ai", category: "음성 처리", rating: 4.5, users: "500만+", icon: "🎤", korean: false }
  ]

  const mockupSlides = [
    {
      title: "자기소개서 작성",
      description: "취업 준비생을 위한 완벽한 자기소개서",
      result: "합격률 78% 향상"
    },
    {
      title: "마케팅 카피",
      description: "효과적인 광고 문구 자동 생성",
      result: "클릭률 3배 증가"
    },
    {
      title: "이메일 작성",
      description: "비즈니스 이메일을 전문적으로",
      result: "작성시간 90% 단축"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* 히어로 섹션 - NHN Commerce 스타일 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0066FF] via-[#1a2c42] to-[#0066FF] text-white">
        <div className="absolute inset-0">
          {/* 기하학적 패턴 배경 */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-32 h-32 border border-white/10 rounded-full"></div>
            <div className="absolute top-40 right-20 w-24 h-24 border border-white/10 rounded-lg rotate-45"></div>
            <div className="absolute bottom-32 left-1/4 w-16 h-16 border border-white/10 rounded-full"></div>
            <div className="absolute top-1/3 right-1/3 w-8 h-8 bg-white/5 rounded-full"></div>
          </div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 왼쪽 텍스트 영역 */}
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Zap className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-sm font-medium">AI 도구 선택의 새로운 기준</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-white">쉬운 선택,</span><br/>
                  <span className="text-[#FF6B35]">정확한 결과</span>
                </h1>
                <p className="text-xl text-white/90 leading-relaxed max-w-lg">
                  복잡한 AI 도구 비교는 그만! <br/>
                  목적만 말하면 <strong className="text-[#FF6B35]">한 번의 클릭</strong>으로<br/>
                  최적의 AI와 완벽한 프롬프트를 제공합니다.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-semibold px-8 py-4 rounded-xl shadow-lg">
                  <Play className="w-5 h-5 mr-2" />
                  지금 바로 체험하기
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl backdrop-blur-sm">
                  <span>3분 데모 보기</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* 신뢰도 지표 */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FF6B35]">100+</div>
                  <div className="text-sm text-white/80">검증된 AI 도구</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FF6B35]">4.8★</div>
                  <div className="text-sm text-white/80">사용자 만족도</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#FF6B35]">50만+</div>
                  <div className="text-sm text-white/80">월 활성 사용자</div>
                </div>
              </div>
            </div>

            {/* 오른쪽 목업폰 영역 */}
            <div className="relative flex justify-center items-center">
              <div className="relative w-80 h-96">
                {/* 메인 폰 (이지픽 사이트) */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-2 shadow-2xl transform rotate-3 z-10">
                  <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                    {/* 폰 헤더 */}
                    <div className="bg-[#0066FF] px-4 py-6 text-white">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                          <svg viewBox="0 0 32 32" className="w-5 h-5 text-white">
                            <path d="M8 16 L16 8 L16 12 L24 12 L24 20 L16 20 L16 24 Z" fill="white"/>
                          </svg>
                        </div>
                        <span className="font-bold">이지픽</span>
                      </div>
                      <h3 className="text-lg font-semibold">{mockupSlides[currentSlide].title}</h3>
                      <p className="text-sm text-blue-100">{mockupSlides[currentSlide].description}</p>
                    </div>
                    
                    {/* 폰 컨텐츠 */}
                    <div className="p-4 space-y-3">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      </div>
                      
                      <div className="bg-[#E6F2FF] p-3 rounded-lg border-l-4 border-[#0066FF]">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-[#00C896]" />
                          <span className="text-sm font-medium text-[#0066FF]">AI 프롬프트 생성 완료</span>
                        </div>
                      </div>
                      
                      <Button className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white rounded-lg py-3">
                        ChatGPT로 전송하기
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 결과 폰 (AI 결과물) */}
                <div className="absolute top-12 -right-8 w-72 h-80 bg-gradient-to-br from-gray-100 to-white rounded-[2.5rem] shadow-xl transform -rotate-6 z-20 border border-gray-200">
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">ChatGPT 결과</span>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <div className="h-2.5 bg-gray-300 rounded"></div>
                        <div className="h-2.5 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-2.5 bg-gray-300 rounded w-4/6"></div>
                        <div className="h-2.5 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-[#00C896]/10 to-[#00C896]/5 p-3 rounded-lg border border-[#00C896]/20">
                        <div className="text-xs font-semibold text-[#00C896] mb-1">성과 지표</div>
                        <div className="text-lg font-bold text-gray-800">{mockupSlides[currentSlide].result}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 클릭 애니메이션 */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 bg-[#FF6B35] rounded-full shadow-lg flex items-center justify-center animate-pulse">
                    <span className="text-white text-sm font-bold">1클릭</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 인기 AI 도구 섹션 */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-[#E6F2FF] text-[#0066FF] px-4 py-2 rounded-full mb-4">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">실시간 인기 순위</span>
            </div>
            <h2 className="text-4xl font-bold text-[#1a2c42] mb-4">🏆 한국인이 가장 많이 선택한 AI</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              카테고리별 상위 2개씩, 실제 사용자 리뷰와 성과를 바탕으로 엄선했습니다
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {featuredTools.map((tool, index) => (
              <Card key={tool.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-[#0066FF]/30 bg-white">
                <CardContent className="p-6 text-center relative">
                  <div className="absolute -top-3 -right-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#FF6B35] to-[#FF6B35]/80 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      #{index + 1}
                    </div>
                  </div>
                  
                  {tool.korean && (
                    <Badge className="absolute -top-2 -left-2 bg-[#00C896] text-white text-xs px-2 py-0.5">
                      한국어
                    </Badge>
                  )}
                  
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{tool.icon}</div>
                  
                  <h3 className="font-bold text-lg mb-2 text-[#1a2c42]">{tool.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{tool.category}</p>
                  
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Star className="w-4 h-4 fill-[#FF6B35] text-[#FF6B35]" />
                    <span className="font-semibold text-[#1a2c42]">{tool.rating}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>{tool.users}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="border-[#0066FF] text-[#0066FF] hover:bg-[#0066FF] hover:text-white px-8 py-4 rounded-xl">
              전체 AI 도구 보기 (100개+)
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* 핵심 가치 제안 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1a2c42] mb-4">왜 이지픽을 선택해야 할까요?</h2>
            <p className="text-lg text-gray-600">복잡한 AI 도구 선택, 이제 고민하지 마세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border border-gray-100 hover:border-[#0066FF]/30 hover:shadow-lg transition-all">
              <CardContent className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#0066FF] to-[#0066FF]/80 rounded-2xl flex items-center justify-center mx-auto">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#1a2c42]">한 번의 클릭</h3>
                <p className="text-gray-600 leading-relaxed">
                  복잡한 비교 분석은 그만!<br/>
                  목적만 선택하면 AI가 최적의<br/>
                  도구와 프롬프트를 즉시 제안합니다.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border border-gray-100 hover:border-[#00C896]/30 hover:shadow-lg transition-all">
              <CardContent className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#00C896] to-[#00C896]/80 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#1a2c42]">검증된 결과</h3>
                <p className="text-gray-600 leading-relaxed">
                  실제 한국 사용자들의<br/>
                  솔직한 리뷰와 성과 데이터로<br/>
                  검증된 AI 도구만 추천합니다.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border border-gray-100 hover:border-[#8B5FBF]/30 hover:shadow-lg transition-all">
              <CardContent className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#8B5FBF] to-[#8B5FBF]/80 rounded-2xl flex items-center justify-center mx-auto">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#1a2c42]">즉시 사용 가능</h3>
                <p className="text-gray-600 leading-relaxed">
                  프롬프트 생성부터 AI 전송까지<br/>
                  원클릭으로 완성! 별도 학습이나<br/>
                  복잡한 설정 없이 바로 시작하세요.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-[#1a2c42] to-[#0066FF]">
        <div className="container mx-auto px-4 text-center text-white">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold">지금 바로 경험해보세요</h2>
            <p className="text-xl text-white/90">
              수십 시간의 AI 도구 비교 대신, <strong className="text-[#FF6B35]">3분만에</strong> 완벽한 결과를 얻어보세요
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-lg">
                🚀 무료로 시작하기
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 py-4 rounded-xl text-lg backdrop-blur-sm">
                📺 3분 데모 영상 보기
              </Button>
            </div>

            <div className="pt-8 text-sm text-white/70">
              ✓ 회원가입 불필요 &nbsp;&nbsp; ✓ 신용카드 등록 불필요 &nbsp;&nbsp; ✓ 100% 무료 체험
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default MainLanding