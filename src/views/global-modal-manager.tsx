/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';

import {
	CloseModalFn,
	CreateModalFn,
	ModalManager,
	useModal
} from '@zextras/carbonio-design-system';

const globalModalObj: { createModal: CreateModalFn; closeModal: CloseModalFn } = {
	createModal: () => {
		throw new Error('global modal manager not initialized');
	},
	closeModal: () => {
		throw new Error('global modal manager not initialized');
	}
};

const GlobalModalManagerProvider = (): null => {
	const { createModal, closeModal } = useModal();
	useEffect(() => {
		globalModalObj.createModal = createModal;
		globalModalObj.closeModal = closeModal;
	}, [createModal, closeModal]);
	return null;
};

export const GlobalModalManager = ({
	children
}: React.PropsWithChildren<Record<string, unknown>>): React.JSX.Element => (
	<ModalManager>
		<GlobalModalManagerProvider />
		{children}
	</ModalManager>
);

export const useGlobalModal = (): { createModal: CreateModalFn; closeModal: CloseModalFn } =>
	globalModalObj;
