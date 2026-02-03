/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useMemo, useRef, useState } from 'react';

import {
	Button,
	Chip,
	Container,
	Padding,
	Popover,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { Tag, useRunSearchIntegration } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';

const BadgeButton = styled(Button)`
	padding: 0.125rem 0.5rem;
`;

const Separator = (): React.JSX.Element => (
	<Padding horizontal="extrasmall">
		<Text color="secondary" size="small">
			{','}
		</Text>
	</Padding>
);

const CompactViewTags = ({
	tags,
	triggerSearch
}: {
	tags: Tag[];
	triggerSearch: (tagToSearch: Tag) => void;
}): ReactElement | null => {
	const [t] = useTranslation();
	const [open, setOpen] = useState(false);
	const popOverRef = useRef(null);

	const toggleOpen = useCallback(
		(ev: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent): void => {
			ev.stopPropagation();
			setOpen(!open);
		},
		[open]
	);

	const moreLabel = useMemo(
		() =>
			t('tooltip.view_more', {
				count: tags.length - 1,
				defaultValue_one: 'View {{count}} more item',
				defaultValue_other: 'View {{count}} more items'
			}),
		[t, tags.length]
	);

	if (tags.length === 0) {
		return null;
	}

	return (
		<>
			<Chip
				key={tags[0].id}
				label={tags[0].name}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore // TODO: fix type in Tag interface
				avatarBackground={tags[0].color}
				background="gray2"
				hasAvatar={false}
				avatarIcon="Tag"
				onClick={(): void => triggerSearch(tags[0])}
			/>
			{tags.length > 1 && (
				<>
					<Separator />
					<Tooltip label={moreLabel}>
						<BadgeButton
							ref={popOverRef}
							onClick={toggleOpen}
							size="small"
							backgroundColor="gray2"
							labelColor="text"
							label={`+${tags.length - 1}`}
							shape="round"
						/>
					</Tooltip>
					<Popover
						open={open}
						anchorEl={popOverRef}
						placement="bottom-end"
						onClose={(): void => setOpen(false)}
						styleAsModal
						disablePortal
						style={{ maxHeight: '300px' }}
					>
						<Container orientation="horizontal" crossAlignment="flex-start">
							<Container
								padding={{ vertical: 'small', left: 'small' }}
								gap="0.5rem"
							>
								{map(tags.slice(1), (tag, index) => (
									<Chip
										key={tag.id}
										label={tag?.name}
										// eslint-disable-next-line @typescript-eslint/ban-ts-comment
										// @ts-ignore // TODO: fix type in Tag interface
										avatarBackground={tag.color}
										background="gray2"
										avatarIcon="Tag"
										onClick={(): void => triggerSearch(tag)}
									/>
								))}
							</Container>
							<Container>
								<Button
									onClick={toggleOpen}
									size="small"
									color="text"
									type="ghost"
									icon="CloseOutline"
								/>
							</Container>
						</Container>
					</Popover>
				</>
			)}
		</>
	);
};

const ExpandedViewTags = ({
	tags,
	triggerSearch
}: {
	tags: Tag[];
	triggerSearch: (tagToSearch: Tag) => void;
}): ReactElement | null => {
	if (tags.length === 0) {
		return null;
	}

	return (
		<>
			{map(tags, (tag, index) => (
				<>
					<Chip
						key={tag.id}
						label={tag?.name}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore // TODO: fix type in Tag interface
						avatarBackground={tag.color}
						background="gray2"
						hasAvatar
						avatarIcon="Tag"
						onClick={(): void => triggerSearch(tag)}
					/>
					{index !== tags.length - 1 && <Separator />}
				</>
			))}
		</>
	);
};

export const TagsInExpandedHeader = ({
	isEml,
	tags,
	open,
	isWide
}: {
	isEml?: boolean;
	tags: Tag[];
	open: boolean;
	isWide: boolean;
}): ReactElement | undefined => {
	const [t] = useTranslation();
	const tagLabel = t('label.tags', 'Tags');

	const runSearch = useRunSearchIntegration();

	const triggerSearch = useCallback(
		(tagToSearch: Tag) =>
			runSearch?.(
				[
					{
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore // TODO: fix type in Tag interface
						avatarBackground: tagToSearch?.color,
						avatarIcon: 'Tag',
						background: 'gray2',
						hasAvatar: true,
						isGeneric: false,
						isQueryFilter: true,
						label: `tag:${tagToSearch?.name}`,
						value: `tag:"${tagToSearch?.name}"`
					}
				],
				'mails'
			),
		[runSearch]
	);

	return !isEml && tags.length > 0 && open ? (
		<Container
			data-testid="tags-in-expanded-header"
			orientation="horizontal"
			crossAlignment="flex-start"
			mainAlignment="flex-start"
			padding={{ left: 'extralarge', bottom: 'small' }}
		>
			<Padding left="small" />
			<Text color="secondary" size="small" overflow="break-word">
				{tagLabel}:
			</Text>
			<Padding left="small" />
			{isWide ? (
				<ExpandedViewTags tags={tags} triggerSearch={triggerSearch} />
			) : (
				<CompactViewTags tags={tags} triggerSearch={triggerSearch} />
			)}
		</Container>
	) : undefined;
};
