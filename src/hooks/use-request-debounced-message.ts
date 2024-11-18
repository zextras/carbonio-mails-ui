/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useMemo } from 'react';

import { debounce } from 'lodash';

import { useAppDispatch } from './redux';
import { DEFAULT_API_DEBOUNCE_TIME } from '../constants';
import { getMsgAsyncThunk } from '../store/actions';

export const useRequestDebouncedMessage = (messageId: string, isComplete = false): void => {
	const dispatch = useAppDispatch();
	const requestDebouncedMessage = useMemo(
		() =>
			debounce(
				() => {
					if (!isComplete) {
						dispatch(getMsgAsyncThunk({ msgId: messageId }));
					}
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[dispatch, isComplete, messageId]
	);

	useEffect(() => {
		requestDebouncedMessage();
		return () => requestDebouncedMessage.cancel();
	}, [requestDebouncedMessage]);
};
