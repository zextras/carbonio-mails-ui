/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Container, List, Padding, Text } from '@zextras/carbonio-design-system';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import ShimmerList from './shimmer-list';
import { AdvancedFilterButton } from './parts/advanced-filter-button';
import { SearchMessageListItem } from './search-message-list-item';
import { SearchListProps } from '../../types';

const SearchMessageList: FC<SearchListProps> = ({
	searchDisabled,
	searchResults,
	search,
	query,
	loading,
	filterCount,
	setShowAdvanceFilters,
	isInvalidQuery
}) => {
	const { itemId, folderId } = useParams<{ itemId: string; folderId: string }>();
	const [t] = useTranslation();

	const hasMore = useMemo(() => searchResults.status === 'hasMore', [searchResults.status]);
	const loadMore = useCallback(
		(date) => {
			if (hasMore && !loading) {
				search(query, false);
			}
		},
		[hasMore, loading, search, query]
	);

	const displayerTitle = useMemo(() => {
		if (searchResults.messages?.length === 0) {
			if (folderId === FOLDERS.SPAM) {
				return t('displayer.list_spam_title', 'There are no spam e-mails');
			}
			if (folderId === FOLDERS.SENT) {
				return t('displayer.list_sent_title', 'You haven’t sent any e-mail yet');
			}
			if (folderId === FOLDERS.DRAFTS) {
				return t('displayer.list_draft_title', 'There are no saved drafts');
			}
			if (folderId === FOLDERS.TRASH) {
				return t('displayer.list_trash_title', 'The trash is empty');
			}
			return t('displayer.list_folder_title', 'It looks like there are no e-mails yet');
		}
		return null;
	}, [searchResults.messages?.length, folderId, t]);

	return (
		<Container background="gray6" width="25%" height="fill" mainAlignment="flex-start">
			<AdvancedFilterButton
				setShowAdvanceFilters={setShowAdvanceFilters}
				filterCount={filterCount}
				searchDisabled={searchDisabled}
			/>
			{searchResults?.messages ? (
				<List
					style={{ paddingBottom: '4px' }}
					background="gray6"
					active={itemId}
					items={searchResults.messages}
					itemProps={{
						folderId,
						isConvChildren: false
					}}
					ItemComponent={SearchMessageListItem}
					onListBottom={(): void =>
						loadMore(searchResults.messages?.[searchResults.messages.length - 1]?.date)
					}
					data-testid={`search-message-list-${folderId}`}
				/>
			) : (
				<Container>
					<Padding top="medium">
						<Text
							color="gray1"
							overflow="break-word"
							size="small"
							style={{ whiteSpace: 'pre-line', textAlign: 'center', paddingTop: '32px' }}
						>
							{displayerTitle}
						</Text>
					</Padding>
				</Container>
			)}
			{loading && <ShimmerList count={33} delay={0} />}
		</Container>
	);
};
export default SearchMessageList;
