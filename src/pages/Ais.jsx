import { AisNav } from '@/components/ais/ais-nav';
import { AisContent } from '@/components/ais/ais-content';

/**
 * 대기측정망 자료관리 시스템 페이지
 * @returns {React.ReactNode} 대기측정망 자료관리 시스템 페이지
 */
function Ais() {
  return (
    <div>
      <AisNav />
      <AisContent />
    </div>
  );
}

export default Ais;
