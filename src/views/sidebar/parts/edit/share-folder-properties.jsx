/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { map, replace, split } from 'lodash';
import {
	Button,
	Chip,
	Container,
	Divider,
	Padding,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useUserAccounts } from '@zextras/carbonio-shell-ui';

import styled from 'styled-components';
import {
	findLabel,
	ShareCalendarRoleOptions
} from '../../../../integrations/shared-invite-reply/parts/utils';
import { Context } from './edit-context';
import { sendShareNotification } from '../../../../store/actions/send-share-notification';
import { capitalise } from '../../utils';

const HoverChip = styled(Chip)`
	background-color: ${({ theme, hovered }) =>
		hovered ? theme.palette.gray3.hover : theme.palette.gray3.regular};
`;
export const GranteeInfo = ({ grant, shareCalendarRoleOptions, hovered }) => {
	const role = useMemo(
		() => findLabel(shareCalendarRoleOptions, grant.perm || ''),
		[shareCalendarRoleOptions, grant.perm]
	);
	const label = useMemo(
		() => `${replace(split(grant.d, '@')?.[0], '.', ' ')} - ${role}`,
		[grant.d, role]
	);
	const upperCaseLabel = useMemo(() => capitalise(label), [label]);
	return (
		<Container crossAlignment="flex-start">
			<Text>
				<HoverChip label={upperCaseLabel} hovered={hovered} />
			</Text>
		</Container>
	);
};

const Actions = ({ folder, grant, createSnackbar, setActiveModal, onMouseLeave, onMouseEnter }) => {
	const [t] = useTranslation();
	const accounts = useUserAccounts();
	const { setActiveGrant } = useContext(Context);
	const dispatch = useDispatch();
	const onRevoke = useCallback(() => {
		setActiveGrant(grant);
		setActiveModal('revoke');
	}, [setActiveModal, setActiveGrant, grant]);

	const onResend = useCallback(() => {
		dispatch(
			sendShareNotification({
				standardMessage: '',
				contacts: [{ email: grant.d }],
				folder,
				accounts
			})
		).then((res) => {
			if (res.type.includes('fulfilled')) {
				createSnackbar({
					key: `resend-${folder.id}`,
					replace: true,
					type: 'info',
					label: t('snackbar.share_resend', 'Share invite resent'),
					autoHideTimeout: 2000,
					hideButton: true
				});
			}
		});
	}, [accounts, dispatch, folder, t, grant.d, createSnackbar]);
	const onEdit = useCallback(() => {
		setActiveGrant(grant);
		setActiveModal('edit');
	}, [setActiveModal, setActiveGrant, grant]);

	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-end"
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			maxWidth="fit"
		>
			<Tooltip label={t('tooltip.edit', 'Edit share properties')} placement="top">
				<Button type="outlined" label={t('label.edit', 'Edit')} onClick={onEdit} isSmall />
			</Tooltip>
			<Padding horizontal="extrasmall" />
			<Tooltip label={t('tooltip.revoke', 'Revoke access')} placement="top">
				<Button
					type="outlined"
					label={t('label.revoke', 'Revoke')}
					color="error"
					onClick={onRevoke}
					isSmall
				/>
			</Tooltip>
			<Padding horizontal="extrasmall" />
			<Tooltip
				label={t('tooltip.resend', 'Send mail notification about this share')}
				placement="top"
				maxWidth="300px"
			>
				<Button type="outlined" label={t('label.resend', 'Resend')} onClick={onResend} isSmall />
			</Tooltip>
		</Container>
	);
};

const Grantee = ({
	grant,
	folder,
	createSnackbar,
	folders,
	allCalendars,
	setModal,
	totalAppointments,
	setActiveModal,
	shareCalendarRoleOptions,
	setActiveGrant
}) => {
	const [hovered, setHovered] = useState(false);
	const onMouseEnter = useCallback(() => {
		setHovered(true);
	}, []);
	const onMouseLeave = useCallback(() => {
		setHovered(false);
	}, []);
	return (
		<Container orientation="horizontal" mainAlignment="flex-end" padding={{ bottom: 'small' }}>
			<GranteeInfo
				grant={grant}
				shareCalendarRoleOptions={shareCalendarRoleOptions}
				hovered={hovered}
			/>
			<Actions
				folder={folder}
				onMouseLeave={onMouseLeave}
				onMouseEnter={onMouseEnter}
				grant={grant}
				createSnackbar={createSnackbar}
				folders={folders}
				allCalendars={allCalendars}
				setModal={setModal}
				setActiveModal={setActiveModal}
				totalAppointments={totalAppointments}
				setActiveGrant={setActiveGrant}
			/>
		</Container>
	);
};

export const ShareFolderProperties = ({
	folder,
	createSnackbar,
	folders,
	allCalendars,
	setModal,
	setActiveGrant,
	totalAppointments,
	setActiveModal
}) => {
	const [t] = useTranslation();
	const grant = folder?.folder?.acl?.grant;
	const shareCalendarRoleOptions = useMemo(
		() => ShareCalendarRoleOptions(t, grant.perm?.includes('p')),
		[t, grant?.perm]
	);
	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<Padding vertical="small" />
			<Text weight="bold">{t('label.shares_folder_edit', 'Sharing of this folder')}</Text>
			<Padding vertical="small" />
			{map(grant, (item) => (
				<Grantee
					key={item.zid}
					setActiveGrant={setActiveGrant}
					grant={item}
					folder={folder}
					createSnackbar={createSnackbar}
					folders={folders}
					allCalendars={allCalendars}
					setModal={setModal}
					setActiveModal={setActiveModal}
					totalAppointments={totalAppointments}
					shareCalendarRoleOptions={shareCalendarRoleOptions}
				/>
			))}
			<Padding top="medium" />
			<Divider />
			<Padding bottom="medium" />
		</Container>
	);
};
