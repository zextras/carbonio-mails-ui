/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import {
	CloseModalFn,
	CreateModalFn,
	CreateSnackbarFn,
	useModal,
	useSnackbar
} from '@zextras/carbonio-design-system';

import { useGlobalModal } from '../views/global-modal-manager';

export type UiUtilities = {
	createModal: CreateModalFn;
	closeModal: CloseModalFn;
	createSnackbar: CreateSnackbarFn;
};

export const useUiUtilities = (): UiUtilities => {
	const { createModal, closeModal } = useModal();
	const createSnackbar = useSnackbar();
	const { createModal: createGlobalModal, closeModal: closeGlobalModal } = useGlobalModal();

	return useMemo(
		() => ({
			createModal: createModal ?? createGlobalModal,
			closeModal: closeModal ?? closeGlobalModal,
			createSnackbar
		}),
		[closeGlobalModal, closeModal, createGlobalModal, createModal, createSnackbar]
	);
};
