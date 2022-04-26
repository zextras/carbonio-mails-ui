/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Avatar, Container, Tooltip } from '@zextras/carbonio-design-system';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ParticipantRole } from '../../../../types/participant';

const AvatarElement = styled(Avatar)`
	width: 42px !important;
	height: 42px !important;
	min-width: 42px !important;
	min-height: 42px !important;
	p {
		font-size: 14px;
	}
`;
export const ItemAvatar = ({ item, selected, selecting, toggle, folderId, isSearch = false }) => {
	const targetParticipants = folderId === '5' ? ParticipantRole.TO : ParticipantRole.FROM;
	const [t] = useTranslation();
	const [avatarLabel, avatarEmail] = useMemo(() => {
		let sender = item?.participants?.find((p) => p.type === targetParticipants);
		if (!sender) [sender] = item.participants ?? [];
		return [sender.fullName || sender.name || sender.address || '.', sender.address];
	}, [item.participants, targetParticipants]);

	const conversationSelect = useCallback(
		(id) => (ev) => {
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
		[t, isSearch]
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
