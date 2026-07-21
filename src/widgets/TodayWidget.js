import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { toKey, addDays } from '../utils/dateUtils';
import { isDueOnDate, statusOf } from '../utils/streakUtils';

const CATEGORY_LABELS = {
  en: {
    health: 'Health',
    fitness: 'Fitness',
    mind: 'Mindfulness',
    productivity: 'Productivity',
    learning: 'Learning',
    other: 'Habit',
  },
  ar: {
    health: 'الصحة',
    fitness: 'اللياقة',
    mind: 'اليقظة الذهنية',
    productivity: 'الإنتاجية',
    learning: 'التعلم',
    other: 'عادة',
  },
};

const TODAY_LABEL = { en: 'Today', ar: 'اليوم' };
const ROW_HEIGHT_DP = 54;
const HEADER_HEIGHT_DP = 54;

function formatMinutes(seconds) {
  return Math.round(seconds / 60);
}

function opacityToArgbHex(opacityPercent) {
  const alpha = Math.max(0, Math.min(255, Math.round((opacityPercent / 100) * 255)));
  const alphaHex = alpha.toString(16).padStart(2, '0');
  return `#${alphaHex}000000`;
}

export default function TodayWidget({
  habits,
  dayOffset = 0,
  opacity = 100,
  language = 'en',
  widgetHeightDp = null,
}) {
  const targetDate = addDays(new Date(), dayOffset);
  const targetKey = toKey(targetDate);
  const due = (habits || []).filter((h) => !h.archived && isDueOnDate(h, targetDate));
  const catLabels = CATEGORY_LABELS[language] || CATEGORY_LABELS.en;

  const dateLabel =
    dayOffset === 0
      ? TODAY_LABEL[language] || TODAY_LABEL.en
      : targetDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

  const subDateLabel = targetDate.toLocaleDateString(
    language === 'ar' ? 'ar-EG' : 'en-US',
    { weekday: 'short', month: 'short', day: 'numeric' }
  );

  const backgroundColor = opacityToArgbHex(opacity);

  const heightIsValid =
    typeof widgetHeightDp === 'number' && Number.isFinite(widgetHeightDp) && widgetHeightDp > 0;
  const maxRows = heightIsValid
    ? Math.max(1, Math.min(20, Math.floor((widgetHeightDp - HEADER_HEIGHT_DP) / ROW_HEIGHT_DP)))
    : 5;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor,
        borderRadius: 24,
        padding: 14,
        paddingBottom: 12,
        flexDirection: 'column',
      }}
    >
      {/* ===== HEADER ===== */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 40,
          marginBottom: 10,
        }}
      >
        {/* LEFT: Icon + Title block (flex:1, takes remaining space) */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
          }}
        >
          {/* App Icon */}
          <FlexWidget
            clickAction="OPEN_APP"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: '#FF8A00',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <TextWidget
              text="∞"
              style={{ color: '#000000', fontSize: 17, fontWeight: 'bold' }}
            />
          </FlexWidget>

          {/* Title + Date stacked vertically */}
          <FlexWidget
            clickAction="OPEN_APP"
            style={{
              flexDirection: 'column',
              justifyContent: 'center',
              marginLeft: 10,
            }}
          >
            <TextWidget
              text={dateLabel}
              style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}
            />
            <TextWidget
              text={subDateLabel}
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: 11,
                fontWeight: '500',
                marginTop: 1,
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* RIGHT: Nav Buttons (fixed width, never wraps) */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <FlexWidget
            clickAction="ADD_HABIT"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.08)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 6,
            }}
          >
            <TextWidget
              text="+"
              style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: '300' }}
            />
          </FlexWidget>
          <FlexWidget
            clickAction="PREV_DAY"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.08)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 6,
            }}
          >
            <TextWidget
              text="‹"
              style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: '300' }}
            />
          </FlexWidget>
          <FlexWidget
            clickAction="NEXT_DAY"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.08)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <TextWidget
              text="›"
              style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: '300' }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* Divider */}
      <FlexWidget
        style={{
          height: 1,
          width: 'match_parent',
          backgroundColor: 'rgba(255,255,255,0.06)',
          marginBottom: 10,
        }}
      />

      {/* Empty State */}
      {due.length === 0 && (
        <TextWidget
          text="No habits for this day"
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center' }}
        />
      )}

      {/* ===== HABIT ROWS ===== */}
      {due.slice(0, maxRows).map((h) => {
        const status = statusOf(h, targetKey);
        const evaluationType = h.evaluationType || 'yesno';
        const isDone = status === 'done';
        const isSkipped = status === 'skipped';

        let progressText = '';
        if (evaluationType === 'numeric') {
          const value = h.values?.[targetKey] || 0;
          progressText = `${value}/${h.numericGoal || 0}`;
        } else if (evaluationType === 'timer') {
          const seconds = h.values?.[targetKey] || 0;
          progressText = `${formatMinutes(seconds)}/${h.timerGoalMinutes || 0}m`;
        } else if (evaluationType === 'checklist') {
          const dayState = h.checklist?.[targetKey] || {};
          const doneCount = (h.checklistItems || []).filter((it) => dayState[it.id]).length;
          progressText = `${doneCount}/${(h.checklistItems || []).length}`;
        }

        const subtitle = catLabels[h.categoryId] || catLabels.other;
        const nameColor = isSkipped ? 'rgba(255,255,255,0.35)' : '#FFFFFF';
        const subColor = isSkipped ? 'rgba(142,142,147,0.7)' : h.color;

        return (
          <FlexWidget
            key={h.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 52,
              marginBottom: 8,
              paddingLeft: 10,
              paddingRight: 10,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.025)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.04)',
            }}
          >
            {/* Accent Color Bar */}
            <FlexWidget
              style={{
                width: 3,
                height: 32,
                borderRadius: 2,
                backgroundColor: h.color,
              }}
            />

            {/* Habit Info (tap to skip) — flex:1 takes remaining space */}
            <FlexWidget
              clickAction="TOGGLE_SKIP"
              clickActionData={{ habitId: h.id, dateKey: targetKey }}
              style={{
                flexDirection: 'column',
                justifyContent: 'center',
                flex: 1,
                marginLeft: 10,
              }}
            >
              {/* Name row */}
              <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
                {h.icon && (
                  <TextWidget
                    text={h.icon}
                    style={{ fontSize: 15, marginRight: 4 }}
                  />
                )}
                <TextWidget
                  text={h.name}
                  style={{
                    color: nameColor,
                    fontSize: 14,
                    fontWeight: '600',
                    textDecoration: isSkipped ? 'line-through' : 'none',
                  }}
                />
                {progressText ? (
                  <TextWidget
                    text={`  ${progressText}`}
                    style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: '500' }}
                  />
                ) : null}
              </FlexWidget>

              {/* Category Label */}
              <TextWidget
                text={subtitle}
                style={{
                  color: subColor,
                  fontSize: 10,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  marginTop: 3,
                }}
              />
            </FlexWidget>

            {/* Action Circle — NO flex, fixed width, never shrinks */}
            <FlexWidget
              clickAction="TOGGLE_DONE"
              clickActionData={{ habitId: h.id, dateKey: targetKey }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDone ? h.color : 'transparent',
                borderWidth: isDone ? 0 : 2,
                borderColor: isSkipped ? 'rgba(142,142,147,0.25)' : h.color,
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 8,
              }}
            >
              {isDone && (
                <TextWidget
                  text="✓"
                  style={{ color: '#000000', fontSize: 16, fontWeight: '800' }}
                />
              )}
              {isSkipped && (
                <TextWidget
                  text="—"
                  style={{ color: 'rgba(142,142,147,0.5)', fontSize: 14, fontWeight: '700' }}
                />
              )}
            </FlexWidget>
          </FlexWidget>
        );
      })}
    </FlexWidget>
  );
}
