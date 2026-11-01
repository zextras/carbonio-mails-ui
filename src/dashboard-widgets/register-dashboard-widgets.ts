/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerActions } from '@zextras/carbonio-shell-ui';

import { WIDGET_ACTION_TYPE } from './constants';
import { foldersSizeWidget } from './folders-size-widget';
import { foldersWidget } from './folders-widget';
import { invitesWidget } from './invites-widget';
import { toWidgetAction, type DashboardWidgetAction } from './types';

export const registerDashboardWidgets = (): void => {
	registerActions<DashboardWidgetAction>(
		{
			id: foldersWidget.id,
			type: WIDGET_ACTION_TYPE,
			action: () => toWidgetAction(foldersWidget)
		},
		{
			id: foldersSizeWidget.id,
			type: WIDGET_ACTION_TYPE,
			action: () => toWidgetAction(foldersSizeWidget)
		},
		{
			id: invitesWidget.id,
			type: WIDGET_ACTION_TYPE,
			action: () => toWidgetAction(invitesWidget)
		}
	);
};
