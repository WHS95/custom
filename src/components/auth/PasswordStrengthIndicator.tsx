"use client";

import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const criteria = [
  { label: "6자 이상", test: (pw: string) => pw.length >= 6 },
  { label: "영문 포함", test: (pw: string) => /[a-zA-Z]/.test(pw) },
  { label: "숫자 포함", test: (pw: string) => /[0-9]/.test(pw) },
  { label: "특수문자 포함", test: (pw: string) => /[^a-zA-Z0-9]/.test(pw) },
];

function getStrength(password: string): number {
  if (!password) return 0;
  return criteria.filter((c) => c.test(password)).length;
}

const strengthConfig = [
  { label: "", color: "" },
  { label: "약함", color: "bg-red-500" },
  { label: "보통", color: "bg-orange-500" },
  { label: "양호", color: "bg-yellow-500" },
  { label: "강함", color: "bg-green-500" },
];

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = getStrength(password);
  const config = strengthConfig[strength];

  return (
    <div className="space-y-2">
      {/* 강도 바 */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              strength >= level ? config.color : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">비밀번호 강도</p>
        {config.label && (
          <p
            className={`text-xs font-medium ${
              strength <= 1
                ? "text-red-500"
                : strength === 2
                ? "text-orange-500"
                : strength === 3
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {config.label}
          </p>
        )}
      </div>

      {/* 조건 체크리스트 */}
      <div className="grid grid-cols-2 gap-1">
        {criteria.map((c) => {
          const passed = c.test(password);
          return (
            <div
              key={c.label}
              className={`flex items-center gap-1 text-xs ${
                passed ? "text-green-600" : "text-gray-400"
              }`}
            >
              {passed ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              {c.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
