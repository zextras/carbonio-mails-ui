/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ComponentType } from 'react';

import type { Action } from '@zextras/carbonio-shell-ui';

/*
 * Types of the contract exposed by carbonio-dashboard-ui.
 * They are duplicated from that project (src/types/widget.ts): it will be decided later
 * whether they will be exported from the dashboard project.
 */

export type WidgetSize = { columns: number; rows: number };

export type SerializedWidgetConfig = { v: number; data: string };

export type WidgetProps<TConfig> = {
	config: TConfig;
	size: WidgetSize;
};

/**
 * The settings component is a controlled form: it shows `config`, the draft being edited, and
 * reports every edit through `onChange`. The dashboard owns the draft and the modal footer,
 * so Save stores the draft and Cancel discards it: the component has no buttons of its own.
 */
export type WidgetSettingsProps<TConfig> = {
	config: TConfig;
	onChange: (config: TConfig) => void;
};

export interface DashboardWidgetAction<TConfig = unknown> extends Action {
	id: string;
	contractVersion: number;
	description?: string;
	defaultSize: WidgetSize;
	Component: ComponentType<WidgetProps<TConfig>>;
	SettingsComponent?: ComponentType<WidgetSettingsProps<TConfig>>;
	defaultConfig: TConfig;
	serialize: (config: TConfig) => SerializedWidgetConfig;
	/** It must never throw: on invalid input it returns the default config */
	deserialize: (serialized: SerializedWidgetConfig | undefined) => TConfig;
}

export const toWidgetAction = <TConfig>(
	widget: DashboardWidgetAction<TConfig>
): DashboardWidgetAction => widget as unknown as DashboardWidgetAction;
