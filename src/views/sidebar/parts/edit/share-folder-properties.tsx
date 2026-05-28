/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import {
	Button,
	Chip,
	Container,
	Divider,
	Padding,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t, useUserAccounts } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { sendShareNotificationSoapApi } from 'api/send-share-notification-soap-api';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { findLabel, ShareCalendarRoleOptions } from 'integrations/shared-invite-reply/parts/utils';
import { ActionProps } from 'types/actions';
import { GranteeInfoProps, GranteeProps, ShareFolderPropertiesProps } from 'types/share';

const HoverChip = styled(Chip)<{ $hovered?: boolean }>`
	background-color: ${({ theme, $hovered }): string =>
		$hovered ? theme.palette.gray3.hover : theme.palette.gray3.regular};
`;

export const GranteeInfo: FC<GranteeInfoProps> = ({ grant, shareCalendarRoleOptions, hovered }) => {
	const role = useMemo(
		() => findLabel(shareCalendarRoleOptions, grant.perm || ''),
		[shareCalendarRoleOptions, grant.perm]
	);

	const label = useMemo(() => {
		const composeLabel = (name: string): string => `${name} - ${role}`;
		return composeLabel(grant.d ?? grant.zid ?? '');
	}, [grant, role]);

	return (
		<Container crossAlignment="flex-start">
			<Text>
				<HoverChip label={label} $hovered={hovered} />
			</Text>
		</Container>
	);
};

const Actions = ({
	folder,
	grant,
	onEdit,
	onRevoke,
	onMouseLeave,
	onMouseEnter
}: ActionProps): React.JSX.Element => {
	const accounts = useUserAccounts();
	const { createSnackbar } = useUiUtilities();

	const handleRevoke = useCallback(() => {
		onRevoke(grant);
	}, [onRevoke, grant]);

	const handleResend = useCallback(() => {
		if (grant.d) {
			sendShareNotificationSoapApi({
				standardMessage: '',
				contacts: [{ email: grant.d }],
				folder,
				accounts
			}).then((res) => {
				const hasFailures =
					!Array.isArray(res) ||
					res.some(
						(item) =>
							typeof item === 'object' && item !== null && ('error' in item || 'Fault' in item)
					);

				if (!hasFailures) {
					createSnackbar({
						key: `resend-${folder.id}`,
						replace: true,
						severity: 'info',
						label: t('snackbar.share_resend', 'Share invite resent'),
						autoHideTimeout: 2000,
						hideButton: true
					});
				}
			});
		}
	}, [accounts, createSnackbar, folder, grant.d]);

	const handleEdit = useCallback(() => {
		onEdit(grant);
	}, [onEdit, grant]);

	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-end"
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			maxWidth="fit"
		>
			<Tooltip label={t('tooltip.edit', 'Edit share properties')} placement="top">
				<Button type="outlined" label={t('label.edit', 'Edit')} onClick={handleEdit} size="small" />
			</Tooltip>
			<Padding horizontal="extrasmall" />
			<Tooltip label={t('tooltip.revoke', 'Revoke access')} placement="top">
				<Button
					type="outlined"
					label={t('label.revoke', 'Revoke')}
					color="error"
					onClick={handleRevoke}
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
					onClick={handleResend}
					size="small"
				/>
			</Tooltip>
		</Container>
	);
};

const Grantee: FC<GranteeProps> = ({ grant, folder, onEdit, onRevoke }) => {
	const [hovered, setHovered] = useState(false);
	const shareCalendarRoleOptions = useMemo(
		() => ShareCalendarRoleOptions(t, grant.perm?.includes('p')),
		[grant.perm]
	);
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
				onEdit={onEdit}
				onRevoke={onRevoke}
			/>
		</Container>
	);
};

export const ShareFolderProperties: FC<ShareFolderPropertiesProps> = ({
	folder,
	grants,
	onEdit,
	onRevoke
}) => (
	<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
		<Padding vertical="small" />
		<Text weight="bold">{t('label.shares_folder_edit', 'Sharing of this folder')}</Text>
		<Padding vertical="small" />
		{map(grants, (item) => (
			<Grantee key={item?.zid} grant={item} folder={folder} onEdit={onEdit} onRevoke={onRevoke} />
		))}
		<Padding top="medium" />
		<Divider />
		<Padding bottom="medium" />
	</Container>
);
