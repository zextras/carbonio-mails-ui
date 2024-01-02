/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';

import { CreateModalFn, ModalManager, useModal } from '@zextras/carbonio-design-system';

const globalCreateModalObj: { createModal: CreateModalFn } = {
	createModal: () => {
		throw new Error('global modal manager not initialized');
	}
};

const GlobalModalManagerProvider = (): null => {
	const createModal = useModal();
	useEffect(() => {
		globalCreateModalObj.createModal = createModal;
	}, [createModal]);
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

export const useGlobalModal = (): CreateModalFn => globalCreateModalObj.createModal;
