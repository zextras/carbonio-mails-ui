/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useContext, useEffect, useMemo, useState } from 'react';
import {
	Button,
	Collapse,
	Container,
	Divider,
	Icon,
	Padding,
	Row,
	SnackbarManagerContext,
	Text
} from '@zextras/carbonio-design-system';
import { FOLDERS, t } from '@zextras/carbonio-shell-ui';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import LabelRow from './parts/label-row';
import ResponseActions from './parts/response-actions';
import { ShareCalendarRoleOptions, findLabel } from './parts/utils';
import { MailMessage } from '../../types';

const InviteContainer = styled(Container)`
	border: 1px solid ${({ theme }: any): string => theme.palette.gray2.regular};
	border-radius: 14px;
	margin: ${({ theme }: any): string => theme.sizes.padding.extrasmall};
`;

type SharedCalendarResponse = {
	sharedContent: string;
	mailMsg: MailMessage;
	onLoadChange?: () => void;
};

const SharedCalendarResponse: FC<SharedCalendarResponse> = ({
	sharedContent,
	mailMsg,
	onLoadChange
}): ReactElement => {
	useEffect(() => {
		if (mailMsg.read === 'false') {
			onLoadChange && onLoadChange();
		}
	}, [mailMsg.read, onLoadChange]);
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();

	const rights = useMemo(
		() => sharedContent?.split('<link ')[1].split('perm="')[1].split('" ')[0],
		[sharedContent]
	);

	const shareCalendarRoleOptions = useMemo(
		() => ShareCalendarRoleOptions(t, rights?.includes('p')),
		[rights]
	);

	const role = useMemo(
		() => findLabel(shareCalendarRoleOptions, rights || ''),
		[shareCalendarRoleOptions, rights]
	);

	const view = useMemo(
		() => sharedContent?.split('<link ')[1]?.split('view="')[1]?.split('" ')[0],
		[sharedContent]
	);

	const zid = useMemo(
		() => sharedContent?.split('<grantor ')[1]?.split('id="')[1]?.split('"')[0],
		[sharedContent]
	);

	const rid = useMemo(
		() => sharedContent?.split('<link ')[1].split('id="')[1].split('" ')[0]?.split('"')[0],
		[sharedContent]
	);

	const notes = useMemo(
		() =>
			mailMsg?.body?.content
				?.substring(Number(mailMsg?.body?.content?.lastIndexOf('<hr />')) + 6)
				.replace(/<p>/gi, '')
				.replace(/<\/p>/gi, ''),
		[mailMsg?.body?.content]
	);

	const [folderType, folderIcon] = useMemo(() => {
		switch (view) {
			case 'message':
				return [t('label.mail_folder', 'Mail Folder'), 'MailModOutline'];
			case 'appointment':
				return [t('label.calendar', 'Calendar'), 'CalendarOutline'];
			default:
				return [t('label.contact_folder', 'Contact Folder'), 'ContactsModOutline'];
		}
	}, [view]);

	const allowedActions = useMemo((): string => {
		if (rights === 'rwidx' || rights === 'rwidxp') {
			return t('message.manager_rights', 'View,Edit,Add,Remove');
		}
		if (rights === 'r' || rights === 'rp') {
			return t('message.view_rights', 'View');
		}
		if (rights === 'rwidxa' || rights === 'rwidxap') {
			return t('message.admin_rights', 'View,Edit,Add,Remove,Administer');
		}
		return 'None';
	}, [rights]);

	const owner = useMemo(
		() => sharedContent?.split('<grantor ')[1]?.split('name="')[1]?.split('"')[0],
		[sharedContent]
	);
	const grantee = useMemo(
		() => sharedContent?.split('<grantee ')[1]?.split('name="')[1]?.split('"')[0],
		[sharedContent]
	);

	const sharedContentItem = useMemo(
		() => sharedContent?.split('<link ')[1]?.split('name="')[1]?.split('" ')[0],
		[sharedContent]
	);

	const [showMoreInfo, setShowMoreInfo] = useState(false);

	return (
		<InviteContainer>
			<Container
				padding={{ top: 'medium', horizontal: 'large', bottom: 'extrasmall' }}
				width="100%"
			>
				<Row padding={{ bottom: 'medium' }}>
					<Icon icon="ShareOutline" size="large" />
					<Padding all="extrasmall" />
					<Row>
						<Text size="large" weight="bold">
							{`${owner} ${t('label.would_like_to_share', 'shared its')}  ${folderType}`}
						</Text>

						<Padding left="small">
							<Text size="large" weight="bold" color="primary">{`"${sharedContentItem}"`}</Text>
						</Padding>
						<Padding left="small">
							<Text size="large" weight="bold">
								{t('label.with_you', 'with you')}
							</Text>
						</Padding>
					</Row>
				</Row>
				<LabelRow
					label={t('label.shared_item', 'Shared item')}
					icon="InfoOutline"
					text={sharedContentItem}
				/>
				<LabelRow label={t('label.owner', 'Owner: ')} icon="PersonOutline" text={owner} />
				<LabelRow label={t('label.grantee', 'Grantee: ')} icon="StarOutline" text={grantee} />
				<LabelRow label={t('label.role', 'Role: ')} icon="ShieldOutline" text={role} />
				<LabelRow label={t('label.type', 'Type:')} icon={folderIcon} text={folderType} />
				<LabelRow
					label={t('label.allowed_actions', 'Allowed Actions : ')}
					icon="UnlockOutline"
					text={allowedActions}
				/>
				<>
					<Container>
						<Collapse orientation="vertical" open={showMoreInfo} crossSize="100%">
							<Container
								width="100%"
								mainAlignment="flex-start"
								crossAlignment="flex-start"
								padding={{ horizontal: 'small', bottom: 'small' }}
							>
								<Row
									padding={{ right: 'small' }}
									mainAlignment="flex-start"
									crossAlignment="flex-start"
								>
									<Row padding={{ right: 'small' }}>
										<Icon icon="MessageSquareOutline" />
									</Row>
									<Row takeAvailableSpace mainAlignment="flex-start" display="flex">
										<Text overflow="break-word" dangerouslySetInnerHTML={{ __html: notes }}></Text>
									</Row>
								</Row>
							</Container>
						</Collapse>
					</Container>
					<Row width="fill" mainAlignment="flex-start" padding={{ all: 'small', bottom: 'medium' }}>
						<Button
							onClick={(): void => setShowMoreInfo(!showMoreInfo)}
							type="outlined"
							size="small"
							label={
								showMoreInfo
									? t('label.hide_more_info', 'Hide more information')
									: t('label.show_more_info', 'Show more information')
							}
						/>
					</Row>
				</>

				{mailMsg.parent !== FOLDERS.TRASH && mailMsg.parent !== FOLDERS.SENT && role !== 'None' && (
					<>
						<Divider />
						<ResponseActions
							createSnackbar={createSnackbar}
							dispatch={dispatch}
							t={t}
							zid={zid}
							view={view}
							rid={rid}
							msgId={mailMsg.id}
							sharedCalendarName={sharedContentItem}
							grantee={grantee}
							owner={owner}
							role={role}
							allowedActions={allowedActions}
							participants={mailMsg.participants}
						/>
					</>
				)}
			</Container>
		</InviteContainer>
	);
};

export default SharedCalendarResponse;
