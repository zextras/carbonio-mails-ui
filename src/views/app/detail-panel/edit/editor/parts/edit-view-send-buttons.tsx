/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo } from 'react';

import { Button, MultiButton, Tooltip, useModal } from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';

import { useEditorSend } from 'store/editor';
import { SendLaterModal } from 'views/app/detail-panel/edit/editor/parts/send-later-modal';

export type EditViewSendButtonsProps = {
	onSendLater: (autoSendTime: number) => void;
	onSendNow: () => void;
	editorId: string;
};

export const EditViewSendButtons: FC<EditViewSendButtonsProps> = ({
	onSendLater,
	onSendNow,
	editorId
}) => {
	const { attrs } = useUserSettings();
	const { createModal, closeModal } = useModal();

	const { status: sendAllowedStatus } = useEditorSend(editorId);

	const disabled = !sendAllowedStatus?.allowed;

	const tooltip = sendAllowedStatus?.reason;

	const onSendLaterClick = useCallback(() => {
		const modalId = Date.now().toString();
		createModal(
			{
				id: modalId,
				maxHeight: '90vh',
				onClose: (): void => {
					closeModal(modalId);
				},
				children: (
					<SendLaterModal
						onAutoSendTimeSelected={(autoSendTime): void => {
							onSendLater(autoSendTime);
							closeModal(modalId);
						}}
						onClose={(): void => closeModal(modalId)}
					/>
				)
			},
			true
		);
	}, [closeModal, createModal, onSendLater]);

	const isSendLaterAllowed = useMemo(
		() => attrs?.zimbraFeatureMailSendLaterEnabled === 'TRUE',
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
						icon={'ChevronDownOutline'}
						items={multiBtnActions}
					/>
				</Tooltip>
			) : (
				<Tooltip label={tooltip} disabled={!disabled}>
					<Button
						color="primary"
						data-testid="BtnSendMail"
						disabled={disabled}
						icon={'PaperPlane'}
						onClick={onSendNow}
						label={t('label.send', 'Send')}
					/>
				</Tooltip>
			)}
		</>
	);
};
