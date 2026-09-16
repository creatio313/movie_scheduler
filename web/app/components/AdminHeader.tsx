"use client";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminHeaderProps = {
  projectId: string;
};

const navigation = [
  { name: "ホーム", path: "/project", href: (projectId: string) => (projectId ? `/project/?id=${projectId}` : "/") },
  { name: "候補日時設定", path: "/manage", href: (projectId: string) => `/manage/?projectId=${projectId}` },
  { name: "キャスト設定", path: "/cast-schedule", href: (projectId: string) => `/cast-schedule/?projectId=${projectId}` },
  { name: "シーン設定", path: "/scenes", href: (projectId: string) => `/scenes/?projectId=${projectId}` },
];

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AdminHeader({ projectId }: AdminHeaderProps) {
  const pathname = usePathname();
  const items = navigation.map((item) => ({
    ...item,
    current: pathname === item.path,
    href: projectId || item.path === "/project" ? item.href(projectId) : "#",
  }));

  return (
    <header> 
        <Disclosure as="nav" className="border-b border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
            <div className="flex min-w-0">
                <div className="flex shrink-0 items-center">
                <Image src="/favicon.svg" alt="撮影計画支援電算処理システムのマーク" width={32} height={32} className="h-8 w-auto" />
                </div>
                <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                {items.map((item) => (
                    <Link
                    key={item.name}
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    className={classNames(
                        item.current
                        ? "border-red-600 text-gray-900 dark:border-red-500 dark:text-white"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200",
                        "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
                    )}
                    >
                    {item.name}
                    </Link>
                ))}
                </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
                <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-red-600 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white dark:focus:outline-red-500">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">メニューを開く</span>
                <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                </DisclosureButton>
            </div>
            </div>
        </div>

        <DisclosurePanel className="sm:hidden">
            <div className="space-y-1 pt-2 pb-3">
            {items.map((item) => (
                <DisclosureButton
                key={item.name}
                as={Link}
                href={item.href}
                aria-current={item.current ? "page" : undefined}
                className={classNames(
                    item.current
                    ? "border-red-600 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-600/10 dark:text-red-300"
                    : "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-200",
                    "block border-l-4 py-2 pr-4 pl-3 text-base font-medium"
                )}
                >
                {item.name}
                </DisclosureButton>
            ))}
            </div>
        </DisclosurePanel>
        </Disclosure>
    </header>
  );
}