/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MsgConvActionsReturnType } from '../use-msg-conv-actions';

/**
 *
 * @param id
 * @param actions
 * @param type - 'primary' | 'secondary'. If not specified, the primary actions are checked.
 */
export const existsActionById = ({
	id,
	actions,
	type
}: {
	id: string;
	actions: MsgConvActionsReturnType;
	type?: 'primary' | 'secondary';
}): boolean =>
	type === 'secondary'
		? actions[1]?.find((action) => action.id === id) !== undefined
		: actions[0]?.find((action) => action.id === id) !== undefined;
