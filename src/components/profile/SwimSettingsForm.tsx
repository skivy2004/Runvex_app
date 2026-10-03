"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { saveSwimSettings } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/Button";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import type { Locale } from "@/core/locale";
import { equipmentNames, equipmentTypes, poolLengths, type Equipment, type PoolLength } from "@/core/workouts/swim";

type SwimSettingsFormProps = {
  poolLength: PoolLength;
  equipment: Equipment[];
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function SwimSettingsForm(props: SwimSettingsFormProps) {
  const t = useTranslations("SwimSettings");
  const tProfile = useTranslations("Profile");
  const locale = useLocale() as Locale;
  const [poolLength, setPoolLength] = useState(props.poolLength);
  const [equipment, setEquipment] = useState(props.equipment);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(item: Equipment) {
    setEquipment((current) =>
      current.includes(item) ? current.filter((other) => other !== item) : [...current, item],
    );
  }

  function save() {
    setFailed(false);
    startTransition(async () => {
      // On success the action redirects back to the profile.
      const result = await saveSwimSettings({ poolLength, equipment });
      if (!result.ok) setFailed(true);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section role="radiogroup" aria-labelledby="pool-title" className="flex flex-col gap-2">
        <h2 id="pool-title" className="text-sm font-semibold text-muted">
          {t("pool")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {poolLengths.map((length) => (
            <ChoiceCard
              key={length}
              kind="radio"
              title={t("poolLength", { length })}
              selected={poolLength === length}
              onSelect={() => setPoolLength(length)}
            />
          ))}
        </div>
        <p className="text-sm text-muted">{t("poolHint")}</p>
      </section>

      <section aria-labelledby="equipment-title" className="flex flex-col gap-2">
        <h2 id="equipment-title" className="text-sm font-semibold text-muted">
          {t("equipment")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {equipmentTypes.map((item) => (
            <ChoiceCard
              key={item}
              kind="checkbox"
              title={capitalize(equipmentNames[item][locale])}
              selected={equipment.includes(item)}
              onSelect={() => toggle(item)}
            />
          ))}
        </div>
        <p className="text-sm text-muted">{t("equipmentHint")}</p>
      </section>

      {failed && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {tProfile("saveFailed")}
        </p>
      )}

      <Button type="button" fullWidth disabled={isPending} onClick={save}>
        {tProfile("save")}
      </Button>
    </div>
  );
}
