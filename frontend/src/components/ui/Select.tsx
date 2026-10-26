"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  forwardRef,
  useCallback,
  useImperativeHandle,
} from "react";
import {
  PiCaretDownLight,
  PiCheckLight,
  PiWarningCircleLight,
  PiXLight,
  PiMagnifyingGlassLight,
} from "react-icons/pi";

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface SelectProps {
  id?: string;
  name?: string;
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  dropdownClassName?: string;
  size?: "sm" | "md" | "lg";
  clearable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  leftIcon?: React.ReactNode;
  onChange?: (e: {
    target: { name: string; id: string; value: string | number };
    currentTarget: { name: string; id: string; value: string | number };
  }) => void;
  onValueChange?: (value: string | number) => void;
  onBlur?: (e: {
    target: { name: string; id: string };
    currentTarget: { name: string; id: string };
  }) => void;
}

export interface SelectRefHandle {
  focus: () => void;
  open: () => void;
  close: () => void;
  getValue: () => string | number;
}

export const Select = forwardRef<SelectRefHandle, SelectProps>(
  (
    {
      id,
      name,
      label,
      error,
      hint,
      options = [],
      value: controlledValue,
      defaultValue,
      placeholder = "Select an option...",
      disabled = false,
      required = false,
      className = "",
      dropdownClassName = "",
      size = "md",
      clearable = false,
      searchable = false,
      searchPlaceholder = "Search options...",
      leftIcon,
      onChange,
      onValueChange,
      onBlur,
      ...restProps
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || (name ? `select-${name}` : `select-${generatedId}`);
    const selectName = name || selectId;

    // Internal state for uncontrolled / controlled hybrid support
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<string | number>(
      defaultValue ?? (options.length > 0 && defaultValue === undefined && !placeholder ? options[0].value : "")
    );

    const currentValue = isControlled ? controlledValue : internalValue;

    // Dropdown open/close state
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const [searchQuery, setSearchQuery] = useState("");
    const [dropUpward, setDropUpward] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      focus: () => triggerRef.current?.focus(),
      open: () => !disabled && setIsOpen(true),
      close: () => setIsOpen(false),
      getValue: () => currentValue,
    }));

    // Find currently selected option
    const selectedOption = options.find(
      (opt: SelectOption) => String(opt.value) === String(currentValue)
    );

    // Filter options if searchable is enabled
    const filteredOptions = searchable && searchQuery.trim()
      ? options.filter((opt: SelectOption) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : options;

    // Calculate whether dropdown should flip upwards when near bottom of viewport
    const updateDropDirection = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const estimatedMenuHeight = Math.min(filteredOptions.length * 44 + 40, 260);
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If space below is tighter than menu height, and space above has more room, drop upwards
      if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
        setDropUpward(true);
      } else {
        setDropUpward(false);
      }
    }, [filteredOptions.length]);

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          handleClose();
        }
      };

      const handleScroll = (event: Event) => {
        // If scrolling inside the dropdown listbox itself, do not close or re-orient
        if (listboxRef.current && listboxRef.current.contains(event.target as Node)) {
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

    // Auto-focus search input when opened if searchable
    useEffect(() => {
      if (isOpen && searchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }, [isOpen, searchable]);

    // Handle opening dropdown
    const handleOpen = () => {
      if (disabled) return;
      updateDropDirection();
      setIsOpen(true);
      setSearchQuery("");

      // Set active index to current selection
      const currIdx = filteredOptions.findIndex(
        (opt: SelectOption) => String(opt.value) === String(currentValue)
      );
      setActiveIndex(currIdx >= 0 ? currIdx : 0);
    };

    // Handle closing dropdown
    const handleClose = () => {
      if (!isOpen) return;
      setIsOpen(false);
      setSearchQuery("");
      setActiveIndex(-1);

      // Trigger onBlur for Formik validation
      onBlur?.({
        target: { name: selectName, id: selectId },
        currentTarget: { name: selectName, id: selectId },
      });
    };

    // Toggle dropdown
    const handleToggle = () => {
      if (isOpen) {
        handleClose();
      } else {
        handleOpen();
      }
    };

    // Handle option selection
    const handleSelectOption = (option: SelectOption) => {
      if (option.disabled) return;

      if (!isControlled) {
        setInternalValue(option.value);
      }

      // Dispatch synthetic event for Formik handleChange compatibility
      onChange?.({
        target: {
          name: selectName,
          id: selectId,
          value: option.value,
        },
        currentTarget: {
          name: selectName,
          id: selectId,
          value: option.value,
        },
      });

      // Dispatch direct value callback if consumer prefers onValueChange
      onValueChange?.(option.value);

      handleClose();
      triggerRef.current?.focus();
    };

    // Handle clear value
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;

      if (!isControlled) {
        setInternalValue("");
      }

      onChange?.({
        target: { name: selectName, id: selectId, value: "" },
        currentTarget: { name: selectName, id: selectId, value: "" },
      });

      onValueChange?.("");
      handleClose();
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            handleOpen();
          } else {
            setActiveIndex((prev) => {
              const next = prev + 1;
              return next < filteredOptions.length ? next : 0;
            });
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (!isOpen) {
            handleOpen();
          } else {
            setActiveIndex((prev) => {
              const next = prev - 1;
              return next >= 0 ? next : filteredOptions.length - 1;
            });
          }
          break;

        case "Enter":
        case " ":
          if (e.target === searchInputRef.current && e.key === " ") {
            // Let user type spaces in search input
            return;
          }
          e.preventDefault();
          if (isOpen && activeIndex >= 0 && activeIndex < filteredOptions.length) {
            handleSelectOption(filteredOptions[activeIndex]);
          } else {
            handleToggle();
          }
          break;

        case "Escape":
          e.preventDefault();
          handleClose();
          triggerRef.current?.focus();
          break;

        case "Tab":
          if (isOpen) {
            handleClose();
          }
          break;

        default:
          break;
      }
    };

    // Scroll active item into view when navigating via keyboard
    useEffect(() => {
      if (isOpen && activeIndex >= 0 && listboxRef.current) {
        const activeElement = listboxRef.current.children[activeIndex] as HTMLElement;
        if (activeElement) {
          activeElement.scrollIntoView({ block: "nearest" });
        }
      }
    }, [activeIndex, isOpen]);

    // Size styling variants
    const sizeClasses: Record<"sm" | "md" | "lg", string> = {
      sm: "h-8 px-2.5 text-xs rounded-lg",
      md: "h-10 px-3.5 text-sm rounded-xl",
      lg: "h-12 px-4 text-base rounded-2xl",
    };
    const currentSizeClass = sizeClasses[size || "md"] || sizeClasses.md;

    return (
      <div
        ref={containerRef}
        className={`w-full space-y-1.5 relative select-none ${className}`}
        onKeyDown={handleKeyDown}
      >
        {/* Hidden Native Input for standard form submission */}
        <input
          type="hidden"
          id={selectId}
          name={selectName}
          value={currentValue ?? ""}
          required={required}
          disabled={disabled}
        />

        {/* Label */}
        {label && (
          <label
            id={`${selectId}-label`}
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#2d4a3e] cursor-pointer"
            onClick={() => triggerRef.current?.focus()}
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        {/* Trigger Button */}
        <div className="relative">
          <button
            ref={triggerRef}
            type="button"
            role="combobox"
            id={`${selectId}-trigger`}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={`${selectId}-listbox`}
            aria-labelledby={label ? `${selectId}-label ${selectId}-trigger` : `${selectId}-trigger`}
            aria-invalid={!!error}
            disabled={disabled}
            onClick={handleToggle}
            className={`w-full text-left flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer outline-none bg-[#ffffff] border ${currentSizeClass} ${
              error
                ? "border-rose-400 text-rose-800 ring-2 ring-rose-400/20"
                : isOpen
                ? "border-[#40916c] ring-3 ring-[#40916c]/20 shadow-sm"
                : "border-[#d8f3dc] hover:border-[#b7e4c7] shadow-xs"
            } ${
              disabled
                ? "opacity-50 cursor-not-allowed bg-[#f8fbf9]"
                : "hover:bg-[#fbfdfc]"
            }`}
            style={{
              boxShadow: isOpen
                ? "0 0 0 3px rgba(64, 145, 108, 0.18), inset 1px 1px 2px rgba(255, 255, 255, 0.9)"
                : undefined,
            }}
          >
            {/* Left Content (Left Icon + Selected Option / Placeholder) */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {leftIcon && (
                <span className="shrink-0 text-[#52796f]">{leftIcon}</span>
              )}

              {selectedOption ? (
                <div className="flex items-center gap-2 truncate">
                  {selectedOption.icon && (
                    <span className="shrink-0 text-[#40916c]">
                      {selectedOption.icon}
                    </span>
                  )}
                  <span className="font-semibold text-[#1b4332] truncate">
                    {selectedOption.label}
                  </span>
                  {selectedOption.badge && (
                    <span className="shrink-0">{selectedOption.badge}</span>
                  )}
                </div>
              ) : (
                <span className="text-[#7a9a8b] truncate">
                  {placeholder}
                </span>
              )}
            </div>

            {/* Right Icons: Clear button + Caret Indicator */}
            <div className="flex items-center gap-1 shrink-0 text-[#52796f]">
              {clearable && currentValue && !disabled && (
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label="Clear selection"
                  onClick={handleClear}
                  className="p-1 rounded-md hover:text-[#1b4332] hover:bg-[#f1faee] transition-colors"
                >
                  <PiXLight className="h-3.5 w-3.5" />
                </span>
              )}
              <PiCaretDownLight
                className={`h-4 w-4 transition-transform duration-200 text-[#52796f] ${
                  isOpen ? "rotate-180 text-[#40916c]" : ""
                }`}
              />
            </div>
          </button>

          {/* Floating Dropdown Panel */}
          {isOpen && (
            <div
              className={`absolute left-0 right-0 z-50 rounded-2xl bg-[#ffffff] border border-[#b7e4c7] shadow-xl overflow-hidden animate-fade-in ${
                dropUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
              } ${dropdownClassName}`}
              style={{
                boxShadow:
                  "0 14px 34px -4px rgba(27, 67, 50, 0.22), 0 4px 14px rgba(0, 0, 0, 0.05), inset 1px 1px 2px rgba(255, 255, 255, 0.9)",
              }}
            >
              {/* Optional Search Input */}
              {searchable && (
                <div className="p-2 border-b border-[#e8f5ec] bg-[#f8fbf9]">
                  <div className="relative flex items-center">
                    <PiMagnifyingGlassLight className="absolute left-2.5 h-3.5 w-3.5 text-[#6b8f7e]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setActiveIndex(0);
                      }}
                      placeholder={searchPlaceholder}
                      className="w-full bg-[#ffffff] pl-8 pr-3 py-1.5 text-xs text-[#1b4332] placeholder-[#7a9a8b] rounded-lg border border-[#d8f3dc] focus:outline-none focus:border-[#40916c] focus:ring-1 focus:ring-[#40916c]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 text-[#7a9a8b] hover:text-[#1b4332]"
                      >
                        <PiXLight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Options List */}
              <ul
                ref={listboxRef}
                id={`${selectId}-listbox`}
                role="listbox"
                aria-labelledby={`${selectId}-label`}
                className="max-h-60 overflow-y-auto p-1.5 space-y-1 focus:outline-none scrollbar-thin"
              >
                {filteredOptions.length === 0 ? (
                  <li className="py-4 px-3 text-center text-xs text-[#6b8f7e] font-medium">
                    No matching options found
                  </li>
                ) : (
                  filteredOptions.map((opt: SelectOption, index: number) => {
                    const isSelected = String(opt.value) === String(currentValue);
                    const isActive = activeIndex === index;

                    return (
                      <li
                        key={String(opt.value)}
                        id={`${selectId}-opt-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={opt.disabled}
                        onClick={() => handleSelectOption(opt)}
                        onMouseEnter={() => !opt.disabled && setActiveIndex(index)}
                        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          opt.disabled
                            ? "opacity-40 cursor-not-allowed bg-transparent text-[#6b8f7e]"
                            : isSelected
                            ? "bg-[#d8f3dc] text-[#1b4332] shadow-2xs font-bold"
                            : isActive
                            ? "bg-[#f1faee] text-[#1b4332]"
                            : "text-[#2d4a3e] hover:bg-[#f1faee] hover:text-[#1b4332]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {opt.icon && (
                            <span
                              className={`shrink-0 ${
                                isSelected ? "text-[#2d6a4f]" : "text-[#52796f]"
                              }`}
                            >
                              {opt.icon}
                            </span>
                          )}

                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{opt.label}</span>
                            {opt.description && (
                              <span className="text-[11px] font-normal text-[#6b8f7e] truncate mt-0.5">
                                {opt.description}
                              </span>
                            )}
                          </div>

                          {opt.badge && (
                            <span className="shrink-0 ml-auto">{opt.badge}</span>
                          )}
                        </div>

                        {isSelected && (
                          <span className="shrink-0 text-[#2d6a4f] flex items-center justify-center h-4 w-4 rounded-full bg-[#b7e4c7]/40">
                            <PiCheckLight className="h-3.5 w-3.5 stroke-[2]" />
                          </span>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Validation Error Message */}
        {error && (
          <p className="text-xs font-medium text-rose-500 animate-fade-in flex items-center gap-1 pt-0.5">
            <PiWarningCircleLight className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {/* Helper Hint */}
        {hint && !error && (
          <p className="text-xs text-[#6b8f7e] pt-0.5">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
