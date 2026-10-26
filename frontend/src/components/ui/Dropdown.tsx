"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { PiCaretDownLight } from "react-icons/pi";

export interface DropdownItem {
  id?: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  badge?: React.ReactNode;
}

export interface DropdownProps {
  trigger?: React.ReactNode;
  label?: string;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
  menuClassName?: string;
  width?: string;
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  label = "Options",
  items,
  align = "right",
  className = "",
  menuClassName = "",
  width = "w-52",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUpward, setDropUpward] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check drop direction
  const updateDropDirection = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const estimatedHeight = items.length * 40 + 20;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      setDropUpward(true);
    } else {
      setDropUpward(false);
    }
  }, [items.length]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    const handleScroll = (event: Event) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      updateDropDirection();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updateDropDirection);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updateDropDirection);
    };
  }, [isOpen, updateDropDirection]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updateDropDirection();
      setIsOpen(true);
      setActiveIndex(-1);
    } else {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    const actionableItems = items.filter((item) => !item.divider && !item.disabled);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          updateDropDirection();
          setIsOpen(true);
          setActiveIndex(0);
        } else {
          setActiveIndex((prev) => (prev + 1 < items.length ? prev + 1 : 0));
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) {
          updateDropDirection();
          setIsOpen(true);
          setActiveIndex(items.length - 1);
        } else {
          setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : items.length - 1));
        }
        break;

      case "Enter":
      case " ":
        if (isOpen && activeIndex >= 0 && items[activeIndex]) {
          const activeItem = items[activeIndex];
          if (!activeItem.disabled && !activeItem.divider) {
            e.preventDefault();
            activeItem.onClick?.();
            setIsOpen(false);
          }
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;

      case "Tab":
        if (isOpen) {
          setIsOpen(false);
        }
        break;

      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger */}
      {trigger ? (
        <div onClick={handleToggle} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer ${
            isOpen
              ? "bg-[#d8f3dc] text-[#1b4332] border-[#40916c] ring-2 ring-[#40916c]/20 shadow-xs"
              : "bg-[#ffffff] text-[#2d4a3e] border-[#d8f3dc] hover:border-[#b7e4c7] hover:bg-[#fbfdfc] shadow-xs"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span>{label}</span>
          <PiCaretDownLight
            className={`h-3.5 w-3.5 transition-transform duration-200 text-[#52796f] ${
              isOpen ? "rotate-180 text-[#40916c]" : ""
            }`}
          />
        </button>
      )}

      {/* Floating Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={`absolute z-50 ${width} rounded-2xl bg-[#ffffff] border border-[#b7e4c7] p-1.5 space-y-0.5 shadow-xl animate-fade-in ${
            dropUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${align === "right" ? "right-0" : "left-0"} ${menuClassName}`}
          style={{
            boxShadow:
              "0 14px 34px -4px rgba(27, 67, 50, 0.22), 0 4px 14px rgba(0, 0, 0, 0.05), inset 1px 1px 2px rgba(255, 255, 255, 0.9)",
          }}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${idx}`}
                  className="my-1 border-t border-[#e8f5ec]"
                  role="separator"
                />
              );
            }

            const isItemActive = activeIndex === idx;

            const itemContent = (
              <div
                className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  item.disabled
                    ? "opacity-40 cursor-not-allowed text-[#6b8f7e]"
                    : item.danger
                    ? isItemActive
                      ? "bg-rose-100 text-rose-800"
                      : "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    : isItemActive
                    ? "bg-[#d8f3dc] text-[#1b4332]"
                    : "text-[#2d4a3e] hover:bg-[#f1faee] hover:text-[#1b4332]"
                }`}
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick?.();
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  {item.icon && (
                    <span
                      className={`shrink-0 ${
                        item.danger
                          ? "text-rose-500"
                          : "text-[#52796f]"
                      }`}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && <span className="shrink-0">{item.badge}</span>}
              </div>
            );

            if (item.href && !item.disabled) {
              return (
                <Link
                  key={item.id || `item-${idx}`}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block focus:outline-none"
                  role="menuitem"
                >
                  {itemContent}
                </Link>
              );
            }

            return (
              <div
                key={item.id || `item-${idx}`}
                role="menuitem"
                className="focus:outline-none"
              >
                {itemContent}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
