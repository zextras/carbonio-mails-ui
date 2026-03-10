/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TFunction } from 'i18next';

import { MarkAsOption } from 'types/filters';

export const getMarkAsOptions = (t: TFunction): Array<MarkAsOption> => [
	{
		label: t('label.read', 'Read'),
		value: { actionFlag: [{ flagName: 'read' }] }
	},
	{
		label: t('label.flagged', 'Flagged'),
		value: { actionFlag: [{ flagName: 'flagged' }] }
	}
];
