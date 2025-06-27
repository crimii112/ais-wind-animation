import { createContext, useContext, useMemo, useState } from 'react';

/** 대기측정망 자료관리 시스템 네비게이션 컨텍스트 */
const AisNavContext = createContext();


/**
 * 대기측정망 자료관리 시스템 네비게이션 프로바이더
 * @param {React.ReactNode} children - 자식 컴포넌트
 * @returns {React.ReactNode} 대기측정망 자료관리 시스템 네비게이션 프로바이더
 */

const AisNavProvider = ({children}) => {
  const [tabList, setTabList] = useState([]);
  
  const contextValue = useMemo(() => ({tabList, setTabList}), [tabList, setTabList]);

  return <AisNavContext.Provider value={contextValue}>{children}</AisNavContext.Provider>;
}

/**
 * 대기측정망 자료관리 시스템 네비게이션 컨텍스트 훅
 * @returns {Object} 대기측정망 자료관리 시스템 네비게이션 컨텍스트 훅
 */

function useAisNav() {
  const context = useContext(AisNavContext);
  if (!context) {
    throw new Error('Cannot find AisNavProvider');
  }

  return context;
}

export { AisNavProvider, useAisNav };