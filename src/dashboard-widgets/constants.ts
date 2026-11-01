/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Action type the dashboard module looks for to list the available widgets */
export const WIDGET_ACTION_TYPE = 'dashboard-widget';

/** Version of the contract with the dashboard module */
export const WIDGET_CONTRACT_VERSION = 3;

export const FOLDERS_WIDGET_ID = 'carbonio-mails-ui:folders-unread';
export const SIZES_WIDGET_ID = 'carbonio-mails-ui:folders-size';
export const INVITES_WIDGET_ID = 'carbonio-mails-ui:pending-invites';

/** Interval between two refreshes of the pending invites list */
export const INVITES_REFRESH_MS = 60_000;
