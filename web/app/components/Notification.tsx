'use client';

import { useState } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';

type NotificationType = 'success' | 'error';

type NotificationProps = {
  message: string;
  type?: NotificationType;
  onClose?: () => void;
};

export function Notification({ message, type = 'error', onClose }: NotificationProps) {
  const [dismissedMessage, setDismissedMessage] = useState('');
  const show = Boolean(message) && dismissedMessage !== message;

  const close = () => {
    setDismissedMessage(message);
    onClose?.();
  };

  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckCircleIcon : ExclamationCircleIcon;

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        <Transition show={show}>
          <div className="pointer-events-auto w-full max-w-sm rounded-lg bg-white shadow-lg outline-1 outline-black/5 transition data-closed:opacity-0 data-enter:transform data-enter:duration-300 data-enter:ease-out data-closed:data-enter:translate-y-2 data-leave:duration-100 data-leave:ease-in data-closed:data-enter:sm:translate-x-2 data-closed:data-enter:sm:translate-y-0 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10">
            <div className="p-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  <Icon
                    aria-hidden="true"
                    className={`size-6 ${isSuccess ? 'text-green-500' : 'text-red-500'}`}
                  />
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {isSuccess ? '成功' : 'エラー'}
                  </p>
                  <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">
                    {message}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0">
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-red-600 dark:hover:text-white dark:focus:outline-red-500"
                  >
                    <span className="sr-only">閉じる</span>
                    <XMarkIcon aria-hidden="true" className="size-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
}