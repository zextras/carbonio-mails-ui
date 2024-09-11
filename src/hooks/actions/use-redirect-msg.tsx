/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { DefaultTheme } from 'styled-components';

import { MessageActionsDescriptors } from '../../constants';
import { StoreProvider } from '../../store/redux';
import RedirectAction from '../../ui-actions/redirect-message-action';
import { useUiUtilities } from '../use-ui-utilities';

export type ActionFn = {
	execute: () => void;
	canExecute: () => boolean;
};

export type UIActionDescriptor = ActionFn & {
	id: string;
	label: string;
	icon: keyof DefaultTheme['icons'];
};

export const useRedirectMsgFn = (messageId: string): ActionFn => {
	const { createModal, closeModal } = useUiUtilities();

	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback((): void => {
		const modalId = Date.now().toString();
		createModal(
			{
				id: modalId,
				maxHeight: '90vh',
				children: (
					<StoreProvider>
						<RedirectAction onClose={(): void => closeModal(modalId)} id={messageId} />
					</StoreProvider>
				)
			},
			true
		);
	}, [closeModal, createModal, messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useRedirectMsgDescriptor = (messageId: string): UIActionDescriptor => {
	const { canExecute, execute } = useRedirectMsgFn(messageId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.REDIRECT.id,
		icon: 'CornerUpRight',
		label: t('action.redirect', 'Redirect'),
		execute,
		canExecute
	};
};
