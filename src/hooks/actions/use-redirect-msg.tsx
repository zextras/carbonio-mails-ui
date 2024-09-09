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

export type ActionFn<ExecArg, CanExecArg> = {
	execute: (arg: ExecArg) => void;
	canExecute: (arg: CanExecArg) => boolean;
};

export type UIActionDescriptor<ExecArg, CanExecArg> = ActionFn<ExecArg, CanExecArg> & {
	id: string;
	label: string;
	icon: keyof DefaultTheme['icons'];
};

export const useRedirectMsgFn = (): ActionFn<never, never> => {
	const { createModal, closeModal } = useUiUtilities();

	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback(
		(id): void => {
			const modalId = Date.now().toString();
			createModal(
				{
					id: modalId,
					maxHeight: '90vh',
					children: (
						<StoreProvider>
							<RedirectAction onClose={(): void => closeModal(modalId)} id={id} />
						</StoreProvider>
					)
				},
				true
			);
		},
		[closeModal, createModal]
	);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useRedirectMsgDescriptor = (): UIActionDescriptor<never, never> => {
	const { canExecute, execute } = useRedirectMsgFn();
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.REDIRECT.id,
		icon: 'CornerUpRight',
		label: t('action.redirect', 'Redirect'),
		execute,
		canExecute
	};
};
