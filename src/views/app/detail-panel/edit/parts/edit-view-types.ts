/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type CreateSnackbar = (arg: {
	key: string;
	replace?: boolean;
	type: string;
	hideButton?: boolean;
	label: string;
	autoHideTimeout: number;
	actionLabel?: string;
	onActionClick?: () => void;
}) => void;
