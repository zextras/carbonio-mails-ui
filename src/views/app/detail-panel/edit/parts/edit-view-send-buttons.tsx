/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo } from 'react';

import { Button, MultiButton, Tooltip, useModal } from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';

import { SendLaterModal } from './send-later-modal';
import { AnimatedLoader } from '../../../../../assets/animated-loader';
import { StoreProvider } from '../../../../../store/redux';

export type EditViewSendButtonsProps = {
	onSendLater: (autoSendTime: number) => void;
	onSendNow: () => void;
	disabled: boolean;
	tooltip: string;
	isLoading: boolean;
};

export const EditViewSendButtons: FC<EditViewSendButtonsProps> = ({
	onSendLater,
	onSendNow,
	disabled,
	tooltip,
	isLoading = false
}) => {
	const { attrs } = useUserSettings();
	const createModal = useModal();

	const onSendLaterClick = useCallback(() => {
		const closeModal = createModal(
			{
				maxHeight: '90vh',
				children: (
					<StoreProvider>
						<SendLaterModal
							onAutoSendTimeSelected={(autoSendTime): void => {
								onSendLater(autoSendTime);
								closeModal();
							}}
							onClose={(): void => closeModal && closeModal()}
							isLoading={isLoading}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [createModal, isLoading, onSendLater]);

	const isSendLaterAllowed = useMemo(
		() => attrs?.zimbraFeatureMailSendLaterEnabled === 'TRUE' || true,
		[attrs?.zimbraFeatureMailSendLaterEnabled]
	);

	const multiBtnActions = useMemo(
		() => [
			...(isSendLaterAllowed
				? [
						{
							id: 'delayed_mail',
							icon: 'ClockOutline',
							label: t('label.send_later', 'Send later'),
							onClick: onSendLaterClick
						}
				  ]
				: [])
		],
		[isSendLaterAllowed, onSendLaterClick]
	);

	return (
		<>
			{multiBtnActions.length > 0 ? (
				<Tooltip label={tooltip} disabled={!disabled}>
					<MultiButton
						data-testid="BtnSendMailMulti"
						label={t('label.send', 'Send')}
						onClick={onSendNow}
						disabledPrimary={disabled}
						disabledSecondary={disabled}
						items={multiBtnActions}
					/>
				</Tooltip>
			) : (
				<Tooltip label={tooltip} disabled={!disabled}>
					<Button
						color="primary"
						data-testid="BtnSendMail"
						disabled={disabled}
						icon={isLoading ? AnimatedLoader : 'PaperPlane'}
						onClick={onSendNow}
						label={t('label.send', 'Send')}
					/>
				</Tooltip>
			)}
		</>
	);
};
