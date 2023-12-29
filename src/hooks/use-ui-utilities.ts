/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useContext, useMemo } from 'react';

import {
	CreateModalFn,
	CreateSnackbarFn,
	ModalManagerContext,
	useSnackbar
} from '@zextras/carbonio-design-system';

import { useGlobalModal } from '../views/global-modal-manager';

export type UiUtilities = {
	createModal: CreateModalFn;
	createSnackbar: CreateSnackbarFn;
};

export const useUiUtilities = (): UiUtilities => {
	const createModal = useContext(ModalManagerContext);
	const createSnackbar = useSnackbar();
	const createGlobalModal = useGlobalModal();

	return useMemo(
		() => ({
			createModal: createModal ?? createGlobalModal,
			createSnackbar
		}),
		[createGlobalModal, createModal, createSnackbar]
	);
};
