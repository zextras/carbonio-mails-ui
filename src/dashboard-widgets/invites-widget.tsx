/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useState } from 'react';

import { Container, Divider, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { useNavigate } from 'react-router-dom';

import { INVITES_REFRESH_MS, INVITES_WIDGET_ID, WIDGET_CONTRACT_VERSION } from './constants';
import type { DashboardWidgetAction, WidgetProps } from './types';
import { searchPendingInvitesSoapApi } from 'api/search-pending-invites-soap-api';
import { MAILS_ROUTE } from 'constants/index';
import type { SoapIncompleteMessage } from 'types/soap/soap-mail-message';

type PendingInvite = { id: string; subject: string; sender: string; date: number };

const toPendingInvite = (m: SoapIncompleteMessage): PendingInvite => {
	const from = m.e?.find((p) => p.t === 'f');
	return {
		id: m.id,
		subject: m.su ?? '',
		sender: from?.d ?? from?.a ?? '',
		date: m.d
	};
};

const usePendingInvites = (): PendingInvite[] => {
	const [invites, setInvites] = useState<PendingInvite[]>([]);

	useEffect(() => {
		let active = true;
		const load = (): void => {
			searchPendingInvitesSoapApi().then((res) => {
				if (active && 'm' in res) {
					setInvites((res.m ?? []).map(toPendingInvite));
				}
			});
		};
		load();
		const interval = setInterval(load, INVITES_REFRESH_MS);
		return (): void => {
			active = false;
			clearInterval(interval);
		};
	}, []);

	return invites;
};

const InviteRow = ({ invite }: { invite: PendingInvite }): React.JSX.Element => {
	const navigate = useNavigate();
	const onClick = useCallback(
		() => navigate(`/${MAILS_ROUTE}/folder/${FOLDERS.INBOX}/message/${invite.id}`),
		[invite.id, navigate]
	);
	return (
		<>
			<Container
				data-testid={`invites-widget-row-${invite.id}`}
				crossAlignment="flex-start"
				padding={{ vertical: 'small', horizontal: 'medium' }}
				height="fit"
				onClick={onClick}
				style={{ cursor: 'pointer' }}
			>
				<Text weight="bold" overflow="ellipsis">
					{invite.subject || t('label.no_subject_with_tags', '<No Subject>')}
				</Text>
				<Text size="small" color="secondary" overflow="ellipsis">
					{invite.sender}
				</Text>
			</Container>
			<Divider />
		</>
	);
};

const InvitesWidget = (_: WidgetProps<Record<string, never>>): React.JSX.Element => {
	const invites = usePendingInvites();

	if (invites.length === 0) {
		return (
			<Container padding={{ all: 'medium' }}>
				<Text color="secondary" textAlign="center">
					{t('dashboard.invites.empty', 'No pending invites')}
				</Text>
			</Container>
		);
	}
	return (
		<Container mainAlignment="flex-start" crossAlignment="stretch" style={{ overflowY: 'auto' }}>
			{invites.map((invite) => (
				<InviteRow key={invite.id} invite={invite} />
			))}
		</Container>
	);
};

export const invitesWidget: DashboardWidgetAction<Record<string, never>> = {
	id: INVITES_WIDGET_ID,
	// evaluated lazily: the translations are not available when the module is loaded
	get label() {
		return t('dashboard.invites.label', 'Pending invites');
	},
	get description() {
		return t('dashboard.invites.description', 'Inbox invites you have not answered yet');
	},
	icon: 'CalendarOutline',
	execute: () => undefined,
	contractVersion: WIDGET_CONTRACT_VERSION,
	defaultSize: { columns: 4, rows: 4 },
	Component: InvitesWidget,
	defaultConfig: {},
	serialize: () => ({ v: 1, data: '{}' }),
	deserialize: () => ({})
};
