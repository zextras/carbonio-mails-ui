/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	Button,
	Collapse,
	Container,
	Divider,
	Icon,
	Padding,
	Row,
	Text
} from '@zextras/carbonio-design-system';
import {
	getIntegratedComponent,
	t,
	useUserAccounts,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';
/* eslint-disable no-nested-ternary */
import { useParams } from 'react-router-dom';

import AttachmentsBlock from './attachments-block';
import PreviewHeader from './parts/preview-header';
import ReadReceiptModal from './read-receipt-modal';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import MailMessageRenderer from '../../../../commons/mail-message-renderer';
import { MessageActionsDescriptors } from '../../../../constants';
import { getAttachmentParts } from '../../../../helpers/attachments';
import { getFolderIdParts } from '../../../../helpers/folders';
import { useAppDispatch } from '../../../../hooks/redux';
import SharedInviteReply from '../../../../integrations/shared-invite-reply';
import { getMsg, msgAction } from '../../../../store/actions';
import type { MailMessage, OpenEmlPreviewType } from '../../../../types';
import { ExtraWindowCreationParams, MessageAction } from '../../../../types';
import { findMessageActionById } from '../../../../ui-actions/utils';
import { useGlobalExtraWindowManager } from '../../extra-windows/global-extra-window-manager';

const [InviteResponse, integrationAvailable] = getIntegratedComponent('invites-reply');

const MailContent: FC<{
	message: MailMessage;
	isMailPreviewOpen: boolean;
	isExternalMessage?: boolean;
	isInsideExtraWindow?: boolean;
	openEmlPreview?: OpenEmlPreviewType;
}> = ({
	message,
	isMailPreviewOpen,
	isExternalMessage = false,
	openEmlPreview,
	isInsideExtraWindow = false
}) => {
	const [showModal, setShowModal] = useState(true);
	const dispatch = useAppDispatch();
	const accounts = useUserAccounts();
	const { prefs } = useUserSettings();
	const moveToTrash = useCallback(() => {
		dispatch(
			msgAction({
				operation: `trash`,
				ids: [message.id]
			})
		);
	}, [message, dispatch]);

	// this is necessary because if somebody click a message in the same conversation
	// already open that message will not be expanded
	useEffect(() => {
		if (!message.isComplete) {
			dispatch(getMsg({ msgId: message.id }));
		}
	}, [dispatch, message.id, message.isComplete]);

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

	const parts = useMemo(
		() => (message.parts ? getAttachmentParts(message.parts) : []),
		[message?.parts]
	);

	const participants = useMemo(() => message?.participants, [message?.participants]);
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
						isInsideExtraWindow ? { vertical: 'small' } : { horizontal: 'large', vertical: 'small' }
					}
					background="gray6"
				>
					<Row>
						<AttachmentsBlock
							message={message}
							isExternalMessage={isExternalMessage}
							openEmlPreview={openEmlPreview}
						/>
					</Row>
					<Padding height="100%" width="100%" vertical="medium">
						{showAppointmentInvite ? (
							<Container width="100%">
								<InviteResponse
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									onLoadChange={(): null => null}
									mailMsg={message}
									inviteId={inviteId}
									participationStatus={participationStatus}
									to={filter(message.participants, { type: 'f' })}
									invite={message.invite}
									method={message.invite[0]?.comp[0].method}
									moveToTrash={moveToTrash}
									isAttendee={isAttendee}
									parent={message.parent}
								/>
							</Container>
						) : showShareInvite ? (
							<SharedInviteReply
								// title={message?.fragment?.split('Shared item:')[0]}
								sharedContent={message.shr[0].content}
								mailMsg={message}
							/>
						) : (
							<MailMessageRenderer
								parts={parts}
								body={message.body}
								id={message.id}
								fragment={message.fragment}
								participants={participants}
								isInsideExtraWindow={isInsideExtraWindow}
							/>
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

type MailPreviewBlockType = {
	message: MailMessage;
	open: boolean;
	onClick: () => void;
	messageActions: Array<MessageAction>;
	isExternalMessage?: boolean;
	isInsideExtraWindow?: boolean;
};
const MailPreviewBlock: FC<MailPreviewBlockType> = ({
	message,
	open,
	onClick,
	messageActions,
	isExternalMessage = false,
	isInsideExtraWindow = false
}) => {
	const { folderId } = useParams<{ folderId: string }>();
	const compProps = useMemo(
		() => ({ message, onClick, open, isExternalMessage, isInsideExtraWindow }),
		[message, onClick, open, isExternalMessage, isInsideExtraWindow]
	);
	const markAsNotSpam = findMessageActionById(
		messageActions,
		MessageActionsDescriptors.MARK_AS_NOT_SPAM.id
	);

	return (
		<>
			{getFolderIdParts(folderId).id === FOLDERS.SPAM && (
				<Container
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					height="fit"
					padding={{ bottom: 'medium' }}
				>
					<Container background="gray6" orientation="horizontal" padding={{ all: 'small' }}>
						<Row width="50%" display="flex" crossAlignment="center" mainAlignment="baseline">
							<Padding right="small">
								<Icon icon="AlertCircleOutline" size="medium" />
							</Padding>
							<Text>
								{t('messages.snackbar.marked_as_spam', 'You’ve marked this e-mail as Spam')}
							</Text>
						</Row>
						<Row width="50%" mainAlignment="flex-end">
							<Button
								type="ghost"
								label={t('action.mark_as_non_spam', 'Not Spam')}
								color="primary"
								onClick={markAsNotSpam}
							/>
						</Row>
					</Container>
				</Container>
			)}
			{message && (
				<Row width="fill">
					<PreviewHeader compProps={compProps} actions={messageActions} />
				</Row>
			)}

			{/* External message disclaimer */}
			{isExternalMessage && (
				<Container height="fit" background="white" padding={{ top: 'large', bottom: 'large' }}>
					<Row
						background="gray2"
						width="fill"
						padding={{ all: 'large' }}
						mainAlignment="flex-start"
					>
						<Padding right="large">
							<Icon icon="AlertCircleOutline" size="large" />
						</Padding>
						<Text>
							{t(
								'label.attachments_disclaimer',
								'You are viewing an attached message. The authenticity of the attached messages can not be verified.'
							)}
						</Text>
					</Row>
					<Divider color="gray1" />
				</Container>
			)}
		</>
	);
};

export type MailPreviewProps = {
	message: MailMessage;
	expanded: boolean;
	messageActions: Array<MessageAction>;
	isAlone: boolean;
	isMessageView: boolean;
	isExternalMessage?: boolean;
	isInsideExtraWindow?: boolean;
	onHeightChange: () => void;
};

export interface MailPreviewPropsWithRef extends MailPreviewProps {
	ref?: React.Ref<HTMLDivElement>;
}

const MailPreview: FC<MailPreviewPropsWithRef> = React.forwardRef<
	HTMLDivElement,
	MailPreviewPropsWithRef
>(
	(
		{
			message,
			expanded,
			messageActions,
			isAlone,
			isMessageView,
			isExternalMessage = false,
			isInsideExtraWindow = false,
			onHeightChange
		},
		ref
	) => {
		const mailContainerRef = ref || useRef<HTMLDivElement>(null);
		const [open, setOpen] = useState(expanded || isAlone);
		const { createWindow } = useGlobalExtraWindowManager();

		const onClick = useCallback(() => {
			setOpen((o) => {
				const newOpen = !o;
				onHeightChange();
				return newOpen;
			});
		}, [onHeightChange]);

		const isMailPreviewOpen = useMemo(
			() => (isMessageView ? true : isAlone ? true : open),
			[isAlone, isMessageView, open]
		);

		/**
		 * To avoid component dependency cycles we define here, outside the
		 * AttachmentsBlock component, the function that open the EML preview
		 */
		const openEmlPreview: OpenEmlPreviewType = useCallback<OpenEmlPreviewType>(
			(parentMessageId: string, attachmentName: string, emlMessage: MailMessage): void => {
				const createWindowParams: ExtraWindowCreationParams = {
					name: `${parentMessageId}-${attachmentName}`,
					returnComponent: false,
					children: (
						<MailPreview
							message={emlMessage}
							expanded={false}
							isAlone
							messageActions={messageActions}
							isMessageView
							isExternalMessage
							isInsideExtraWindow
							onHeightChange={onHeightChange}
						/>
					),
					title: emlMessage.subject,
					closeOnUnmount: false
				};
				if (createWindow) {
					createWindow(createWindowParams);
				}
			},
			[createWindow, messageActions, onHeightChange]
		);

		const [containerHeight, setHeight] = useState(open ? '100%' : 'fit-content');

		useEffect(() => {
			setHeight(open ? '100%' : 'fit-content');
		}, [open]);

		useEffect(() => {
			onHeightChange();
		}, [open, onHeightChange]);

		return (
			<Container
				ref={mailContainerRef}
				height={containerHeight}
				data-testid={`MailPreview-${message.id}`}
				padding={isInsideExtraWindow ? { all: 'large' } : undefined}
				background="white"
			>
				<MailPreviewBlock
					onClick={onClick}
					message={message}
					open={isMailPreviewOpen}
					messageActions={messageActions}
					isExternalMessage={isExternalMessage}
					isInsideExtraWindow={isInsideExtraWindow}
				/>

				<Container
					width="fill"
					height="fit"
					style={{
						flex: '1'
					}}
				>
					{(open || isAlone) && (
						<MailContent
							message={message}
							isMailPreviewOpen={isMailPreviewOpen}
							openEmlPreview={openEmlPreview}
							isExternalMessage={isExternalMessage}
							isInsideExtraWindow={isInsideExtraWindow}
						/>
					)}
				</Container>
			</Container>
		);
	}
);

export default MailPreview;
