/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { find, map, filter, isEmpty } from 'lodash';
import {
	useUserAccounts,
	useReplaceHistoryCallback,
	useAppContext,
	useIntegratedComponent,
	useUserSettings,
	FOLDERS
} from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';
import {
	Container,
	Text,
	Avatar,
	Badge,
	Collapse,
	Icon,
	Padding,
	Button,
	Row
} from '@zextras/carbonio-design-system';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import MailMessageRenderer from '../../../../commons/mail-message-renderer';
import { getTimeLabel, participantToString } from '../../../../commons/utils';
import AttachmentsBlock from './attachments-block';
import { selectFolders } from '../../../../store/folders-slice';
import { setMsgAsSpam } from '../../../../ui-actions/message-actions';
import MailMsgPreviewActions from '../../../../ui-actions/mail-message-preview-actions';
import { selectMessages, selectMessagesStatus } from '../../../../store/messages-slice';
import { getMsg, msgAction } from '../../../../store/actions';
import { retrieveAttachmentsType } from '../../../../store/editor-slice-utils';
import SharedInviteReply from '../../../../integrations/shared-invite-reply';
import { useMessageActions } from '../../../../hooks/use-message-actions';

const ContactsContainer = styled.div`
	display: grid;
	grid-template-rows: auto;
	grid-template-columns: repeat(3, auto);
`;
const ContactText = styled(Text)`
	&:not(:first-child) {
		&:before {
			content: '|';
			padding: 0 4px;
		}
	}
`;

function MessageContactsList({ message }) {
	const [t] = useTranslation();

	const accounts = useUserAccounts();
	const toContacts = filter(message.participants, ['type', 't']);
	const ccContacts = filter(message.participants, ['type', 'c']);
	const bccContacts = filter(message.participants, ['type', 'b']);

	return (
		<ContactsContainer>
			{toContacts.length > 0 && (
				<ContactText color="gray1" size="small" data-testid="ToParticipants">
					{`${t('label.to', 'To')} `}
					{map(toContacts, (contact) => participantToString(contact, t, accounts)).join(', ')}
				</ContactText>
			)}
			{ccContacts.length > 0 && (
				<ContactText color="gray1" size="small" data-testid="CcParticipants">
					{`${t('label.cc', 'CC')} `}
					{map(ccContacts, (contact) => participantToString(contact, t, accounts)).join(', ')}
				</ContactText>
			)}
			{bccContacts.length > 0 && (
				<ContactText color="gray1" size="small">
					{`${t('label.bcc', 'BCC')} `}
					{map(bccContacts, (contact) => participantToString(contact, t, accounts)).join(', ')}
				</ContactText>
			)}
		</ContactsContainer>
	);
}

const fallbackContact = { address: '', displayName: '' };
const HoverContainer = styled(Container)`
	cursor: pointer;
	border-radius: ${({ isExpanded }) => (isExpanded ? '4px 4px 0 0' : '4px')};
	&:hover {
		background: ${({ theme, background }) => theme.palette[background].hover};
	}
`;

const MailPreviewBlock = ({ message, open, onClick }) => {
	const [t] = useTranslation();
	const replaceHistory = useReplaceHistoryCallback();
	const { folderId } = useParams();
	const accounts = useUserAccounts();
	const dispatch = useDispatch();
	const { isMessageView } = useAppContext();
	const { folderId: currentFolderId } = useParams();
	const folders = useSelector(selectFolders);
	const messageFolder = folders[message.parent.includes(':') ? folderId : message.parent];
	const mainContact = find(message.participants, ['type', 'f']) || fallbackContact;
	const _onClick = useCallback((e) => !e.isDefaultPrevented() && onClick(e), [onClick]);
	const attachments = retrieveAttachmentsType(message, 'attachment');
	const senderContact = find(message.participants, ['type', 's']);
	const textReadValues = useMemo(() => {
		if (typeof message.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read', size: 'small' };
		return message.read
			? { color: 'text', weight: 'regular', badge: 'read', size: 'small' }
			: { color: 'primary', weight: 'bold', badge: 'unread', size: 'medium' };
	}, [message.read]);
	const actions = useMessageActions(message);

	return (
		<>
			{folderId === FOLDERS.DRAFTS && (
				<Container
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					height="fit"
					padding={{ vertical: 'medium' }}
				>
					<Container background="gray6" orientation="horizontal" padding={{ all: 'small' }}>
						<Row width="50%" display="flex" crossAlignment="center" mainAlignment="baseline">
							<Padding right="small">
								<Icon icon="AlertCircleOutline" size="medium" />
							</Padding>
							<Text>You marked this email as spam.</Text>
						</Row>
						<Row width="50%" mainAlignment="flex-end">
							<Button
								type="ghost"
								label="Not Spam"
								color="primary"
								onClick={() =>
									setMsgAsSpam([message.id], true, t, dispatch, replaceHistory).click()
								}
							/>
						</Row>
					</Container>
				</Container>
			)}
			{/* {isMailSentToYourself && (
				<Container
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					height="fit"
					padding={{ vertical: 'medium' }}
				>
					<Container background="gray6" orientation="horizontal" padding={{ all: 'small' }}>
						<Row width="50%" display="flex" crossAlignment="center" mainAlignment="baseline">
							<Padding right="small">
								<Icon icon="AlertCircleOutline" size="medium" />
							</Padding>
							<Text>If you need to take a note, you can add a task to your TODO LIST</Text>
						</Row>
						<Row width="50%" mainAlignment="flex-end">
							<Button type="ghost" label="Create New Task" color="primary" />
						</Row>
					</Container>
				</Container>
			)} */}
			<HoverContainer
				onClick={_onClick}
				orientation="horizontal"
				height="fit"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				background="gray6"
				isExpanded={open}
			>
				<Container
					orientation="vertical"
					width="fit"
					mainAlignment="flex-start"
					padding={{ all: 'small' }}
				>
					<Avatar
						label={mainContact.fullName || mainContact.address}
						colorLabel={mainContact.address}
						size="large"
					/>
				</Container>

				<Row
					orientation="vertical"
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					height="fit"
					width="calc(100% - 48px)"
					padding={{ all: 'small' }}
					takeAvailableSpace
				>
					<Container orientation="horizontal" mainAlignment="space-between" width="fill">
						<Row
							// this style replace takeAvailableSpace prop, it calculates growth depending from content (all 4 props are needed)
							style={{
								flexGrow: 1,
								flexBasis: 'content',
								overflow: 'hidden',
								whiteSpace: 'nowrap'
							}}
							mainAlignment="flex-start"
							wrap="nowrap"
						>
							{isEmpty(senderContact) ? (
								<Row takeAvailableSpace width="fit" mainAlignment="flex-start" wrap="nowrap">
									<Text
										data-testid="SenderText"
										size={message.read ? 'small' : 'medium'}
										color={message.read ? 'text' : 'primary'}
										weight={message.read ? 'normal' : 'bold'}
									>
										{participantToString(mainContact, t, accounts)}
									</Text>
									<Padding left="small" />
									<Text color="gray1" size={message.read ? 'small' : 'medium'}>
										{mainContact.address && mainContact.address}
									</Text>
								</Row>
							) : (
								<Text overflow="break-word">
									<Text
										data-testid="SenderText"
										size={message.read ? 'small' : 'medium'}
										color={message.read ? 'text' : 'primary'}
										weight={message.read ? 'normal' : 'bold'}
									>
										{senderContact.fullName && `"${senderContact.fullName}"`}
									</Text>
									<Padding left="small">
										<Text color="gray1" size={message.read ? 'small' : 'medium'}>
											{senderContact.address && `<${senderContact.address}>`}
										</Text>
									</Padding>
									<Text size="small">{` ${t('label.on_behalf_of', 'on behalf of')} `}</Text>
									<Text
										data-testid="SenderText"
										size={message.read ? 'small' : 'medium'}
										color={message.read ? 'text' : 'primary'}
										weight={message.read ? 'normal' : 'bold'}
									>
										{mainContact.fullName && `"${mainContact.fullName}"`}
									</Text>

									<Padding left="small">
										<Text color="gray1" size={message.read ? 'small' : 'medium'}>
											{mainContact.address && `<${mainContact.address}>`}
										</Text>
									</Padding>
								</Text>
							)}
						</Row>
						<Row
							wrap="nowrap"
							mainAlignment="flex-end"
							// this style replace takeAvailableSpace prop, it calculates growth depending from content (all 4 props are needed)
							style={{
								flexGrow: 1,
								flexBasis: 'content',
								whiteSpace: 'nowrap'
							}}
						>
							{message.attachment && attachments.length > 0 && (
								<Padding left="small">
									<Icon icon="AttachOutline" />
								</Padding>
							)}
							{message.flagged && (
								<Padding left="small">
									<Icon color="error" icon="Flag" data-testid="FlagIcon" />
								</Padding>
							)}
							<Padding left="small">
								<Text color="gray1" data-testid="DateLabel" size="extrasmall">
									{getTimeLabel(message.date)}
								</Text>
							</Padding>
							{!isMessageView && open && <MailMsgPreviewActions actions={actions} maxActions={6} />}
						</Row>
					</Container>
					{!open && (
						<Container
							orientation="horizontal"
							mainAlignment="flex-start"
							crossAlignment="center"
							height="16px"
						>
							<MessageContactsList message={message} />
						</Container>
					)}
					<Container
						orientation="horizontal"
						mainAlignment="space-between"
						crossAlignment="flex-end"
						padding={{ top: open ? 'small' : '0' }}
						height="24px"
					>
						<Container
							orientation="horizontal"
							mainAlignment="flex-start"
							crossAlignment="center"
							width="fill"
							style={{ minWidth: '0' }}
						>
							{open ? (
								<MessageContactsList message={message} />
							) : (
								<Text color="text" size="medium">
									{message.fragment}
								</Text>
							)}
						</Container>
						<Container
							orientation="horizontal"
							width="fit"
							padding={{ left: 'extrasmall', right: open ? 'extrasmall' : undefined }}
						>
							{message.urgent && <Icon data-testid="UrgentIcon" color="error" icon="ArrowUpward" />}
							{messageFolder?.name && messageFolder.id !== currentFolderId && (
								<Padding left="small">
									<Badge
										data-testid="FolderBadge"
										value={messageFolder.name}
										type={textReadValues.badge}
									/>
								</Padding>
							)}
						</Container>
					</Container>
				</Row>
			</HoverContainer>
		</>
	);
};

export default function MailPreview({ message, expanded, isAlone, isMessageView }) {
	const dispatch = useDispatch();
	const mailContainerRef = useRef(undefined);
	const accounts = useUserAccounts();
	const settings = useUserSettings();
	const timezone = useMemo(
		() => settings?.prefs.zimbraPrefTimeZoneId,
		[settings?.prefs.zimbraPrefTimeZoneId]
	);
	const [open, setOpen] = useState(expanded);
	const [InviteResponse, integrationAvailable] = useIntegratedComponent('invites-reply');
	const messageStatus = useSelector(selectMessagesStatus)[message.id];
	const msg = useSelector(createSelector([selectMessages], (msgs) => msgs[message.id] ?? {}));

	const aggregatedMessage = useMemo(() => ({ ...message, ...msg }), [message, msg]);

	const moveToTrash = useCallback(() => {
		dispatch(
			msgAction({
				operation: `trash`,
				ids: [msg.id]
			})
		);
	}, [msg, dispatch]);

	// this is necessary because if somebody click a message in the same conversation
	// already open that message will not be expanded
	useEffect(() => {
		setOpen(expanded);
	}, [expanded]);

	const showAppointmentInvite = useMemo(
		() =>
			message.isInvite &&
			message.invite?.[0]?.comp &&
			message.isInvite &&
			(message.invite?.[0]?.comp[0].method === 'REQUEST' ||
				message.invite?.[0]?.comp[0].method === 'COUNTER') &&
			integrationAvailable &&
			InviteResponse,
		[integrationAvailable, InviteResponse, message]
	);

	const showShareInvite = useMemo(
		() =>
			message.shr &&
			message.shr.length > 0 &&
			!message.fragment.includes('revoked') &&
			!message.fragment.includes('has accepted') &&
			!message.fragment.includes('has declined'),
		[message]
	);

	useEffect(() => {
		if (!message.isComplete) {
			dispatch(getMsg({ msgId: message.id }));
		}
	}, [message, open, dispatch]);
	const loggedInUser = useMemo(() => accounts[0]?.name, [accounts]);
	const isAttendee = useMemo(
		() => message.invite?.[0]?.comp?.[0]?.or?.a !== loggedInUser,
		[loggedInUser, message]
	);

	const collapsedContent = useMemo(
		() => (
			<Container
				data-testid="MessageBody"
				width="100%"
				height="fit"
				crossAlignment="stretch"
				padding={{ horizontal: 'large', vertical: 'small' }}
				background="gray6"
			>
				<Row>
					<AttachmentsBlock message={aggregatedMessage} />
				</Row>
				<Padding style={{ width: '100%' }} vertical="medium">
					{showAppointmentInvite ? (
						<Container width="100%">
							<InviteResponse
								// eslint-disable-next-line @typescript-eslint/no-empty-function
								onLoadChange={() => {}}
								mailMsg={aggregatedMessage}
								inviteId={`${message.invite[0].comp[0].apptId}-${message.id}`}
								participationStatus={
									message.invite[0].replies ? message.invite[0].replies[0].reply[0].ptst : ''
								}
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
							title={message.fragment.split('Shared item:')[0]}
							sharedContent={message.shr[0].content}
							mailMsg={aggregatedMessage}
						/>
					) : (
						<MailMessageRenderer
							key={message.id}
							mailMsg={aggregatedMessage}
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							onLoadChange={() => {}}
						/>
					)}
				</Padding>
			</Container>
		),
		[
			aggregatedMessage,
			InviteResponse,
			message,
			moveToTrash,
			showShareInvite,
			showAppointmentInvite,
			isAttendee
		]
	);
	const onClick = () => {
		setOpen((o) => !o);
	};
	return (
		<Container ref={mailContainerRef} height="fit" data-testid={`MailPreview-${message.id}`}>
			<MailPreviewBlock
				onClick={onClick}
				message={aggregatedMessage}
				timezone={timezone}
				// open={isAlone ? true : open}
				// eslint-disable-next-line no-nested-ternary
				open={isMessageView ? true : isAlone ? true : open}
			/>

			<Container
				width="fill"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				<Collapse
					// eslint-disable-next-line no-nested-ternary
					open={isMessageView ? true : isAlone ? true : open}
					// open={isAlone ? true : open}
					crossSize="100%"
					orientation="vertical"
					disableTransition
					data-testid="MailMessageRendererCollapse"
				>
					{messageStatus === 'complete' && collapsedContent}
				</Collapse>
			</Container>
		</Container>
	);
}
