/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useModal, useSnackbar } from '@zextras/carbonio-design-system';

import { UiUtilities } from '../types';

export const useUiUtilities = (): UiUtilities => {
	const createModal = useModal();
	const createSnackbar = useSnackbar();

	const createPlaceholderFn = useCallback(
		(functionName: string): (() => void) =>
			(): void => {
				console.warn(`${functionName} not set`);
			},
		[]
	);

	return useMemo(
		() => ({
			createModal: createModal ?? createPlaceholderFn('createModal'),
			createSnackbar: createSnackbar ?? createPlaceholderFn('createSnackbar')
		}),
		[createModal, createPlaceholderFn, createSnackbar]
	);
};
