import { X } from 'lucide-react';
import { cn } from '@/lib/utils';


/** 모달 프레임 컴포넌트 */
const ModalFrame = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'fixed min-h-screen max-h-screen inset-0 z-1000 flex items-center justify-center bg-black/50',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative z-50 h-[650px] w-[1000px] overflow-x-hidden rounded-sm bg-white shadow-lg',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};
ModalFrame.displayName = 'ModalFrame';

/** 모달 헤더 컴포넌트 */
const ModalHeader = ({ title, handleCloseModal, className, ...props }) => {
  return (
    <div
      className={cn(
        'p-4 flex flex-row justify-between items-center bg-gray-200',
        className
      )}
    >
      <div className="text-xl font-bold">{title}</div>
      <X onClick={handleCloseModal} {...props} />
    </div>
  );
};
ModalHeader.displayName = 'ModalHeader';

/** 모달 컨텐츠 컴포넌트 */
const ModalContent = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('flex flex-col w-full h-[calc(100%-114px)] p-3', className)}
      {...props}
    >
      {children}
    </div>
  );
};
ModalContent.displayName = 'ModalContent';

/** 모달 푸터 컴포넌트 */
const ModalFooter = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'flex w-full justify-center items-center pb-3.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
ModalFooter.displayName = 'ModalFooter';

export { ModalFrame, ModalHeader, ModalContent, ModalFooter };
