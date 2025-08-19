// src/components/PreviewCompare.v2.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check,
  ChevronLeft,
  ChevronRight,
  Settings2,
  RotateCcw,
  Diff,
  ArrowRight
} from 'lucide-react';

/* ========================================
 * 미리보기 비교 UI 컴포넌트 (v2)
 * 지시: Simple/Advanced 2열 비교 + 클릭 교체
 * 부연: 변경 필드 하이라이트, aria-live 접근성
 * ======================================== */

const PreviewCompare = ({ 
  originalData = {}, 
  modifiedData = {}, 
  onApply,
  onRevert,
  templateSchema = null,
  className = ""
}) => {
  // 상태 관리
  const [viewMode, setViewMode] = useState('simple'); // 'simple' | 'advanced'
  const [selectedChanges, setSelectedChanges] = useState(new Set());
  const [copiedField, setCopiedField] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isLiveRegion, setIsLiveRegion] = useState(false);

  // 변경사항 분석
  const changes = useMemo(() => {
    const changeList = [];
    const allKeys = new Set([...Object.keys(originalData), ...Object.keys(modifiedData)]);
    
    allKeys.forEach(key => {
      const original = originalData[key];
      const modified = modifiedData[key];
      
      if (original !== modified) {
        changeList.push({
          key,
          label: getFieldLabel(key, templateSchema),
          type: getChangeType(original, modified),
          original,
          modified,
          category: getFieldCategory(key, templateSchema)
        });
      }
    });
    
    return changeList;
  }, [originalData, modifiedData, templateSchema]);

  // 선택된 변경사항만 필터링
  const filteredChanges = useMemo(() => {
    if (selectedChanges.size === 0) return changes;
    return changes.filter(change => selectedChanges.has(change.key));
  }, [changes, selectedChanges]);

  // 변경사항 통계
  const changeStats = useMemo(() => {
    const stats = changes.reduce((acc, change) => {
      acc[change.type] = (acc[change.type] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: changes.length,
      added: stats.added || 0,
      modified: stats.modified || 0,
      removed: stats.removed || 0
    };
  }, [changes]);

  // 미리보기 데이터 생성
  const previewData = useMemo(() => {
    const result = { ...originalData };
    
    changes.forEach(change => {
      if (selectedChanges.size === 0 || selectedChanges.has(change.key)) {
        if (change.type === 'removed') {
          delete result[change.key];
        } else {
          result[change.key] = change.modified;
        }
      }
    });
    
    return result;
  }, [originalData, changes, selectedChanges]);

  // 접근성 업데이트
  useEffect(() => {
    if (changes.length > 0) {
      setIsLiveRegion(true);
      const timer = setTimeout(() => setIsLiveRegion(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [changes.length]);

  // 필드 레이블 가져오기
  const getFieldLabel = (key, schema) => {
    if (!schema?.options) return key;
    const option = schema.options.find(opt => opt.key === key);
    return option?.label || key;
  };

  // 변경 타입 결정
  const getChangeType = (original, modified) => {
    if (original === undefined) return 'added';
    if (modified === undefined) return 'removed';
    return 'modified';
  };

  // 필드 카테고리 가져오기
  const getFieldCategory = (key, schema) => {
    const basicFields = ['tone', 'length', 'style'];
    const contentFields = ['topic', 'subject', 'content'];
    const metaFields = ['company', 'recipient', 'urgency'];
    
    if (basicFields.includes(key)) return 'basic';
    if (contentFields.includes(key)) return 'content';
    if (metaFields.includes(key)) return 'meta';
    return 'other';
  };

  // 클립보드 복사
  const handleCopy = async (text, fieldKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  // 변경사항 토글
  const toggleChange = (changeKey) => {
    setSelectedChanges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(changeKey)) {
        newSet.delete(changeKey);
      } else {
        newSet.add(changeKey);
      }
      return newSet;
    });
  };

  // 모든 변경사항 선택/해제
  const toggleAllChanges = () => {
    if (selectedChanges.size === changes.length) {
      setSelectedChanges(new Set());
    } else {
      setSelectedChanges(new Set(changes.map(c => c.key)));
    }
  };

  // 변경사항 적용
  const handleApply = () => {
    const appliedData = { ...originalData };
    
    changes.forEach(change => {
      if (selectedChanges.size === 0 || selectedChanges.has(change.key)) {
        if (change.type === 'removed') {
          delete appliedData[change.key];
        } else {
          appliedData[change.key] = change.modified;
        }
      }
    });
    
    onApply?.(appliedData);
  };

  // 변경 타입별 스타일링
  const getChangeTypeColor = (type) => {
    switch (type) {
      case 'added': return 'bg-green-100 text-green-800 border-green-200';
      case 'modified': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'removed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 값 렌더링 (길이 제한)
  const renderValue = (value, maxLength = 100) => {
    if (value === undefined || value === null) {
      return <span className="text-gray-400 italic">없음</span>;
    }
    
    const stringValue = String(value);
    if (stringValue.length <= maxLength) {
      return stringValue;
    }
    
    return (
      <span title={stringValue}>
        {stringValue.substring(0, maxLength)}...
      </span>
    );
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* 접근성 라이브 리전 */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {isLiveRegion && `${changeStats.total}개의 변경사항이 감지되었습니다.`}
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Diff className="w-5 h-5" />
            변경사항 미리보기
          </h3>
          
          {/* 변경사항 통계 */}
          <div className="flex items-center gap-2">
            {changeStats.added > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                +{changeStats.added}
              </Badge>
            )}
            {changeStats.modified > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                ~{changeStats.modified}
              </Badge>
            )}
            {changeStats.removed > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                -{changeStats.removed}
              </Badge>
            )}
          </div>
        </div>

        {/* 뷰 모드 토글 */}
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple" className="text-sm">
              Simple
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-sm">
              Advanced
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 변경사항이 없는 경우 */}
      {changes.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">변경사항이 없습니다</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 변경사항이 있는 경우 */}
      {changes.length > 0 && (
        <Tabs value={viewMode} className="w-full">
          {/* Simple 모드 */}
          <TabsContent value="simple" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 원본 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-gray-600">
                    원본
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {changes.map((change) => (
                        <div key={`original-${change.key}`} className="p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{change.label}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(change.original, `original-${change.key}`)}
                              disabled={!change.original}
                            >
                              {copiedField === `original-${change.key}` ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <div className="text-sm text-gray-700">
                            {renderValue(change.original)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 수정본 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-600">
                    수정본
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {changes.map((change) => (
                        <div 
                          key={`modified-${change.key}`} 
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                            selectedChanges.has(change.key) 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-gray-200 bg-white'
                          }`}
                          onClick={() => toggleChange(change.key)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleChange(change.key);
                            }
                          }}
                          aria-pressed={selectedChanges.has(change.key)}
                          aria-label={`${change.label} 변경사항 ${selectedChanges.has(change.key) ? '선택됨' : '선택 안됨'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{change.label}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getChangeTypeColor(change.type)}`}
                              >
                                {change.type === 'added' && '추가'}
                                {change.type === 'modified' && '수정'}
                                {change.type === 'removed' && '삭제'}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(change.modified, `modified-${change.key}`);
                              }}
                              disabled={!change.modified}
                            >
                              {copiedField === `modified-${change.key}` ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <div className="text-sm text-gray-700">
                            {renderValue(change.modified)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced 모드 */}
          <TabsContent value="advanced" className="space-y-4">
            {/* 제어 패널 */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAllChanges}
                    >
                      {selectedChanges.size === changes.length ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          전체 해제
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          전체 선택
                        </>
                      )}
                    </Button>
                    
                    <span className="text-sm text-gray-600">
                      {selectedChanges.size}/{changes.length} 선택됨
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedChanges(new Set())}
                      disabled={selectedChanges.size === 0}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      초기화
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 상세 비교 테이블 */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 w-12">선택</th>
                        <th className="text-left p-4">필드</th>
                        <th className="text-left p-4">타입</th>
                        <th className="text-left p-4">원본</th>
                        <th className="text-left p-4">수정본</th>
                        <th className="text-left p-4 w-20">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changes.map((change, index) => (
                        <tr 
                          key={change.key}
                          className={`border-b hover:bg-gray-50 ${
                            selectedChanges.has(change.key) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedChanges.has(change.key)}
                              onChange={() => toggleChange(change.key)}
                              className="rounded border-gray-300"
                              aria-label={`${change.label} 선택`}
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{change.label}</div>
                            <div className="text-xs text-gray-500">{change.key}</div>
                          </td>
                          <td className="p-4">
                            <Badge 
                              variant="outline" 
                              className={getChangeTypeColor(change.type)}
                            >
                              {change.type === 'added' && '추가'}
                              {change.type === 'modified' && '수정'}
                              {change.type === 'removed' && '삭제'}
                            </Badge>
                          </td>
                          <td className="p-4 max-w-xs">
                            <div className="truncate">{renderValue(change.original, 50)}</div>
                          </td>
                          <td className="p-4 max-w-xs">
                            <div className="truncate">{renderValue(change.modified, 50)}</div>
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleChange(change.key)}
                              aria-label={`${change.label} 적용`}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* 액션 버튼 */}
      {changes.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedChanges.size > 0 
                  ? `${selectedChanges.size}개 변경사항이 적용됩니다` 
                  : '적용할 변경사항을 선택하세요'
                }
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onRevert}
                  disabled={selectedChanges.size === 0}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  되돌리기
                </Button>
                
                <Button
                  onClick={handleApply}
                  disabled={selectedChanges.size === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  적용하기 ({selectedChanges.size})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PreviewCompare;