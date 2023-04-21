/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Button,
	Chip,
	ChipProps,
	Container,
	Divider,
	Padding,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import {
	getBridgedFunctions,
	Grant,
	soapFetch,
	t,
	useUserAccounts
} from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import styled from 'styled-components';
import { useAppDispatch } from '../../../../hooks/redux';
import {
	findLabel,
	ShareCalendarRoleOptions
} from '../../../../integrations/shared-invite-reply/parts/utils';
import { sendShareNotification } from '../../../../store/actions/send-share-notification';
import type {
	ActionProps,
	GranteeInfoProps,
	GranteeProps,
	ShareFolderPropertiesProps
} from '../../../../types';
import { Context } from './edit-context';

const HoverChip = styled(Chip)<ChipProps & { hovered?: boolean }>`
	background-color: ${({ theme, hovered }): string =>
		hovered ? theme.palette.gray3.hover : theme.palette.gray3.regular};
`;

export const GranteeInfo: FC<GranteeInfoProps> = ({ grant, shareCalendarRoleOptions, hovered }) => {
	const role = useMemo(
		() => findLabel(shareCalendarRoleOptions, grant.perm || ''),
		[shareCalendarRoleOptions, grant.perm]
	);

	const label = useMemo(() => {
		const composeLabel = (name: string): string => `${name} - ${role}`;
		return grant.d ? composeLabel(grant.d) : composeLabel(grant.zid);
	}, [grant, role]);

	return (
		<Container crossAlignment="flex-start">
			<Text>
				<HoverChip label={label} hovered={hovered} />
			</Text>
		</Container>
	);
};

const Actions: FC<ActionProps> = ({
	folder,
	grant,
	setActiveModal,
	onMouseLeave,
	onMouseEnter
}) => {
	// eslint-disable-next-line @typescript-eslint/ban-types
	const accounts = useUserAccounts();
	const { setActiveGrant } = useContext(Context);
	// eslint-disable-next-line @typescript-eslint/ban-types
	const dispatch = useAppDispatch() as Function;
	const onRevoke = useCallback(() => {
		if (setActiveGrant) setActiveGrant(grant);
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
		).then((res: Response) => {
			if (res.type.includes('fulfilled')) {
				getBridgedFunctions()?.createSnackbar({
					key: `resend-${folder.id}`,
					replace: true,
					type: 'info',
					label: t('snackbar.share_resend', 'Share invite resent'),
					autoHideTimeout: 2000,
					hideButton: true
				});
			}
		});
	}, [accounts, dispatch, folder, grant.d]);
	const onEdit = useCallback(() => {
		if (setActiveGrant) setActiveGrant(grant);
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
				<Button type="outlined" label={t('label.edit', 'Edit')} onClick={onEdit} size="small" />
			</Tooltip>
			<Padding horizontal="extrasmall" />
			<Tooltip label={t('tooltip.revoke', 'Revoke access')} placement="top">
				<Button
					type="outlined"
					label={t('label.revoke', 'Revoke')}
					color="error"
					onClick={onRevoke}
					size="small"
				/>
			</Tooltip>
			<Padding horizontal="extrasmall" />
			<Tooltip
				label={t('tooltip.resend', 'Send mail notification about this share')}
				placement="top"
				maxWidth="18.75rem"
			>
				<Button
					type="outlined"
					label={t('label.resend', 'Resend')}
					onClick={onResend}
					size="small"
				/>
			</Tooltip>
		</Container>
	);
};
const Grantee: FC<GranteeProps> = ({ grant, folder, setActiveModal, shareCalendarRoleOptions }) => {
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
				setActiveModal={setActiveModal}
			/>
		</Container>
	);
};

export const ShareFolderProperties: FC<ShareFolderPropertiesProps> = ({
	folder,
	setActiveModal
}) => {
	const [grant, setGrant] = useState<Array<Grant> | undefined>();

	useEffect(() => {
		soapFetch('GetFolder', {
			_jsns: 'urn:zimbraMail',
			folder: { l: folder.id }
		}).then((res: any): void => {
			if (res?.folder) {
				setGrant(res.folder[0].acl.grant);
			}
		});
	}, [folder.id]);

	const shareCalendarRoleOptions = useMemo(
		() => ShareCalendarRoleOptions(t, grant?.[0]?.perm?.includes('p')),
		[grant]
	);
	return (
		<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
			<Padding vertical="small" />
			<Text weight="bold">{t('label.shares_folder_edit', 'Sharing of this folder')}</Text>
			<Padding vertical="small" />
			{map(grant, (item) => (
				<Grantee
					key={item?.zid}
					grant={item}
					folder={folder}
					setActiveModal={setActiveModal}
					shareCalendarRoleOptions={shareCalendarRoleOptions}
				/>
			))}
			<Padding top="medium" />
			<Divider />
			<Padding bottom="medium" />
		</Container>
	);
};
