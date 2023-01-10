/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Avatar, Container, Tooltip } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import React, { useCallback, useMemo, FC, SyntheticEvent } from 'react';
import styled from 'styled-components';
import { ParticipantRole } from '../../../../carbonio-ui-commons/constants/participants';
import { ItemAvatarType, Participant } from '../../../../types';

const AvatarElement = styled(Avatar)`
	width: 2.625rem !important;
	height: 2.625rem !important;
	min-width: 2.625rem !important;
	min-height: 2.625rem !important;
	p {
		font-size: 0.875rem;
	}
`;

export const ItemAvatar: FC<ItemAvatarType> = ({
	item,
	selected,
	selecting,
	toggle,
	folderId,
	isSearch = false
}) => {
	const targetParticipants = folderId === '5' ? ParticipantRole.TO : ParticipantRole.FROM;
	const [avatarLabel, avatarEmail] = useMemo(() => {
		let sender = item?.participants?.find((p: Participant) => p.type === targetParticipants);
		if (!sender) [sender] = item.participants ?? [];
		return [sender?.fullName || sender?.name || sender?.address || '.', sender?.address];
	}, [item.participants, targetParticipants]);

	const conversationSelect = useCallback(
		(id) => (ev: SyntheticEvent) => {
			ev.preventDefault();
			toggle && toggle(id);
		},
		[toggle]
	);

	const activateSelectionMode = useMemo(
		() =>
			isSearch
				? t(
						'label.search_activate_selection_mode',
						'Selection mode isn’t available yet on search results'
				  )
				: t('label.activate_selection_mode', 'Activate selection mode'),
		[isSearch]
	);
	return (
		<Container
			mainAlignment="center"
			crossAlignment="center"
			data-testid={`AvatarContainer`}
			padding={{ all: 'small' }}
		>
			<Tooltip label={activateSelectionMode} disabled={selecting} maxWidth="100%">
				<AvatarElement
					selecting={selecting}
					selected={selected}
					label={avatarLabel}
					colorLabel={avatarEmail}
					onClick={conversationSelect(item.id)}
					size="large"
				/>
			</Tooltip>
		</Container>
	);
};
