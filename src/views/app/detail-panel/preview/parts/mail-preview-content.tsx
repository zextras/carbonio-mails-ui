/* eslint-disable no-nested-ternary */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import { Collapse, Container, Padding, Row } from '@zextras/carbonio-design-system';
import {
	getIntegratedComponent,
	useUserAccounts,
	useUserSettings
} from '@zextras/carbonio-shell-ui';

import { MailMessageRenderer } from '../../../../../commons/mail-message-renderer/mail-message-renderer';
import { isFocusModeMailView } from '../../../../../helpers/external-tabs';
import SharedInviteReply from '../../../../../integrations/shared-invite-reply';
import { msgActionEmailStoreAction } from '../../../../../store/emails/actions/msg-action-action';
import type { IncompleteMessage, MailMessage } from '../../../../../types';
import AttachmentsBlock from '../attachments-block';
import ReadReceiptModal from '../read-receipt-modal';

const [InviteResponse, integrationAvailable] = getIntegratedComponent('invites-reply');

type MailPreviewContentProps = {
	message: MailMessage | IncompleteMessage;
	isMailPreviewOpen: boolean;
	isEml?: boolean;
};
export const MailPreviewContent = ({
	message,
	isMailPreviewOpen,
	isEml = false
}: MailPreviewContentProps): React.JSX.Element => {
	const [showModal, setShowModal] = useState(true);
	const messageId = message.id;
	const accounts = useUserAccounts();
	const { prefs } = useUserSettings();
	const moveToTrash = useCallback(() => {
		msgActionEmailStoreAction({
			operation: `trash`,
			ids: [messageId]
		});
	}, [messageId]);

	const showAppointmentInvite = useMemo(
		() =>
			message.isInvite &&
			message.invite?.[0]?.comp &&
			message.isInvite &&
			(message.invite?.[0]?.comp[0].method === 'REQUEST' ||
				message.invite?.[0]?.comp[0].method === 'COUNTER') &&
			integrationAvailable &&
			InviteResponse,
		[message]
	);

	const readReceiptSetting = useMemo(() => prefs?.zimbraPrefMailSendReadReceipts, [prefs]);
	const showReadReceiptModal = useMemo(
		() =>
			(showModal &&
				message.isReadReceiptRequested &&
				!message?.isSentByMe &&
				readReceiptSetting === 'prompt') ??
			false,
		[showModal, message, readReceiptSetting]
	);

	const showShareInvite = useMemo(
		() =>
			message &&
			message?.shr &&
			message?.shr?.length > 0 &&
			message.fragment &&
			!message?.fragment.includes('revoked') &&
			!message?.fragment.includes('has accepted') &&
			!message?.fragment.includes('has declined'),
		[message]
	);

	const onModalClose = useCallback(() => {
		setShowModal(false);
	}, []);
	const loggedInUser = useMemo(() => accounts[0]?.name, [accounts]);
	const isAttendee = useMemo(
		() => message.invite?.[0]?.comp?.[0]?.or?.a !== loggedInUser,
		[loggedInUser, message]
	);

	const { inviteId, participationStatus } = {
		/*
		 * Compose the invite ID
		 * The invite ID is composed by the following fields:
		 * - the appointment ID (if present)
		 * - the message ID
		 * If the 2 fields are both present they will be separated by a hyphen otherwise only the message ID will be used
		 *
		 * The appointment ID is present only if the appointment was automatically added to the calendar (following the
		 * user's preferences)
		 */
		inviteId: showAppointmentInvite
			? message.invite[0].comp[0].apptId
				? `${message.invite[0].comp[0].apptId}-${message.id}`
				: message.id
			: '',

		// Compose the participation status
		participationStatus:
			showAppointmentInvite && message.invite[0].replies
				? message.invite[0].replies[0].reply[0].ptst
				: ''
	};
	return (
		<Collapse
			open={isMailPreviewOpen}
			crossSize="100%"
			orientation="vertical"
			disableTransition
			data-testid="MailMessageRendererCollapse"
			style={{ height: '100%' }}
		>
			{message.isComplete && (
				<Container
					data-testid="MessageBody"
					width="100%"
					height="100%"
					crossAlignment="stretch"
					padding={
						isFocusModeMailView()
							? { vertical: 'small' }
							: { horizontal: 'large', vertical: 'small' }
					}
					background="gray6"
				>
					<Row>
						<AttachmentsBlock
							messageId={message.id}
							messageSubject={message.subject}
							messageAttachments={message.attachments}
							isEml={isEml}
						/>
					</Row>
					<Padding height="100%" width="100%" vertical="medium" style={{ overflow: 'auto' }}>
						{showAppointmentInvite && (
							<Container width="100%">
								<InviteResponse mailMsg={message} moveToTrash={moveToTrash} />
							</Container>
						)}
						{!showAppointmentInvite && showShareInvite && (
							<SharedInviteReply sharedContent={message.shr[0].content} mailMsg={message} />
						)}
						{!showAppointmentInvite && !showShareInvite && (
							<MailMessageRenderer message={message} />
						)}
					</Padding>
					<ReadReceiptModal
						open={showReadReceiptModal}
						onClose={onModalClose}
						message={message}
						readReceiptSetting={readReceiptSetting}
					/>
				</Container>
			)}
		</Collapse>
	);
};
