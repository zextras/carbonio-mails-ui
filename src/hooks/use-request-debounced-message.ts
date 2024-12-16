/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useMemo } from 'react';

import { debounce } from 'lodash';

import { getMsg } from '../api/helpers/get-msg-service';
import { DEFAULT_API_DEBOUNCE_TIME } from '../constants';

export const useRequestDebouncedMessage = (messageId: string, isComplete = false): void => {
	const requestDebouncedMessage = useMemo(
		() =>
			debounce(
				() => {
					if (!isComplete) {
						getMsg({ msgId: messageId });
					}
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[isComplete, messageId]
	);

	useEffect(() => {
		requestDebouncedMessage();
		return () => requestDebouncedMessage.cancel();
	}, [requestDebouncedMessage]);
};
