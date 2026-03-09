/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { ActionFn } from 'types/actions';

/**
 * Hook to encapsulate the logic used across components to mark a message/conversation as read
 * when a user interacts (e.g., onClick) based on user preference and dynamic conditions.
 */
export type UseMarkAsReadOnClickParams = {
	/** Whether the entity is already read */
	isRead: boolean;
	/** Action descriptor returned by hooks like useMsgSetReadFn / useConvSetReadFn */
	action: ActionFn;
	/** Additional boolean conditions that all must be true to proceed */
	conditions?: Array<boolean>;
};

export const useMarkAsReadOnClick = ({
	isRead,
	action,
	conditions = []
}: UseMarkAsReadOnClickParams): (() => void) => {
	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	return useCallback(() => {
		if (!isRead && zimbraPrefMarkMsgRead && conditions.every(Boolean)) {
			action.canExecute() && action.execute();
		}
	}, [isRead, zimbraPrefMarkMsgRead, action, conditions]);
};
