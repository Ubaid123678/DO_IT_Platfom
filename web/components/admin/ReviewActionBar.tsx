"use client";

import { useState } from "react";
import { Button } from "../ui/Button";

export type ReviewAction = "approve" | "reject" | "request_info";

export interface ReviewActionBarProps {
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onRequestInfo?: (reason: string) => void;
  disabled?: boolean;
  disabledNote?: string;
  busyAction?: ReviewAction | null;
}

export function ReviewActionBar({
  onApprove,
  onReject,
  onRequestInfo,
  disabled = false,
  disabledNote,
  busyAction = null,
}: ReviewActionBarProps) {
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);
  const [activeAction, setActiveAction] = useState<"reject" | "request_info">("reject");
  const [touched, setTouched] = useState(false);

  const hasReasonAction = !!onReject || !!onRequestInfo;
  const reasonValid = reason.trim().length >= 3;

  const openReason = (action: "reject" | "request_info") => {
    setActiveAction(action);
    setShowReason(true);
    setTouched(false);
  };

  const confirmReason = () => {
    setTouched(true);
    if (!reasonValid) return;
    const trimmed = reason.trim();
    if (activeAction === "reject" && onReject) {
      onReject(trimmed);
    } else if (activeAction === "request_info" && onRequestInfo) {
      onRequestInfo(trimmed);
    }
    setShowReason(false);
    setReason("");
  };

  if (disabled) {
    return (
      <div className="rounded-xl border border-border bg-bg/60 p-4">
        <p className="text-[13px] text-text-hint">
          {disabledNote ?? "Review actions are unavailable for this record."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {onApprove && (
          <Button
            variant="success"
            loading={busyAction === "approve"}
            disabled={busyAction !== null}
            onClick={() => onApprove()}
          >
            Approve
          </Button>
        )}
        {onRequestInfo && (
          <Button
            variant="secondary"
            loading={busyAction === "request_info"}
            disabled={busyAction !== null}
            onClick={() => openReason("request_info")}
          >
            Request Info
          </Button>
        )}
        {onReject && (
          <Button
            variant="danger"
            loading={busyAction === "reject"}
            disabled={busyAction !== null}
            onClick={() => openReason("reject")}
          >
            Reject
          </Button>
        )}
      </div>

      {hasReasonAction && showReason && (
        <div className="rounded-xl border border-border bg-bg/40 p-4">
          <label className="mb-1.5 block text-[13px] font-medium text-text-secondary">
            {activeAction === "reject" ? "Rejection reason" : "Reason for requesting more info"}
          </label>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (touched) setTouched(false);
            }}
            rows={3}
            placeholder="Explain why so the provider can address it…"
            className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
          {touched && !reasonValid && (
            <p className="mt-1 text-xs text-error">
              {reason.trim().length === 0 ? "Reason is required" : "Reason must be at least 3 characters"}
            </p>
          )}
          <div className="mt-3 flex justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowReason(false);
                setReason("");
                setTouched(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={activeAction === "reject" ? "danger" : "secondary"}
              loading={busyAction === activeAction}
              disabled={busyAction !== null || !reasonValid}
              onClick={confirmReason}
            >
              Confirm {activeAction === "reject" ? "Rejection" : "Request"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
