/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { screen, waitFor, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { getTags, useContactInput } from '@zextras/carbonio-ui-commons';
import { format } from 'date-fns';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import {
	EDIT_ACTION,
	generateMockContactInputItem,
	generateMockedContactInput
} from '@test-utils/integrations/mock-contact-input';
import { populateFoldersStore } from '@test-utils/store/folders';
import { tags as mockTags } from '@test-utils/tags/tags';
import { TIMERS } from '__test__/constants';
import { AdvancedFilterModal } from 'views/search/advanced-filter-modal';
import { defaultProps } from 'views/search/test/test-advanced-filter-modal-common-utils';
import { AdvancedFilterModalProps, SearchQueryItem } from 'views/search/types/types';

vi.mock('@zextras/carbonio-ui-commons', async () => {
	const actual = await vi.importActual<typeof import('@zextras/carbonio-ui-commons')>(
		'@zextras/carbonio-ui-commons'
	);
	return {
		...actual,
		getTags: vi.fn(),
		useContactInput: vi.fn().mockImplementation(actual.useContactInput)
	};
});

async function selectOption(
	user: UserEvent,
	selectTestId: string,
	optionText: string
): Promise<void> {
	await user.click(within(screen.getByTestId(selectTestId)).getByTestId('icon: ChevronDown'));
	await user.click(await screen.findByText(optionText));
}

describe('AdvancedFilterModal', () => {
	describe('initial state', () => {
		it('renders the modal', () => {
			setupTest(<AdvancedFilterModal {...defaultProps} />);
			expect(screen.getByText(/label\.single_advanced_filter/i)).toBeInTheDocument();
		});

		it('disables search and reset buttons when no query is set', () => {
			setupTest(<AdvancedFilterModal {...defaultProps} />);
			expect(screen.getByRole('button', { name: /action\.search/i })).toBeDisabled();
			expect(screen.getByRole('button', { name: /action\.reset/i })).toBeDisabled();
		});

		it('enables search and reset buttons when a query is present', () => {
			const query = [{ id: 'q1', label: 'keywords', value: 'keyword' }];
			setupTest(<AdvancedFilterModal {...defaultProps} query={query} />);
			expect(screen.getByRole('button', { name: /action\.search/i })).toBeEnabled();
			expect(screen.getByRole('button', { name: /action\.reset/i })).toBeEnabled();
		});

		it('enables search button after typing in keyword input', async () => {
			const { user } = setupTest(<AdvancedFilterModal {...defaultProps} />);
			const confirmButton = screen.getByRole('button', { name: /action\.search/i });
			expect(confirmButton).toBeDisabled();
			const keywordInputEle = within(screen.getByTestId('keywords-input')).getByRole('textbox');
			await user.click(keywordInputEle);
			await user.type(keywordInputEle, 'x');
			await user.click(screen.getByTestId('subject-input'));
			expect(confirmButton).toBeEnabled();
		});
	});

	describe('query building', () => {
		it('calls onSearchConfirm with keyword query and closes the modal', async () => {
			const onSearchConfirm = vi.fn();
			const onClose = vi.fn();
			const { user } = setupTest(
				<AdvancedFilterModal
					{...defaultProps}
					onSearchConfirm={onSearchConfirm}
					onClose={onClose}
				/>
			);
			const keywordInputEle = within(screen.getByTestId('keywords-input')).getByRole('textbox');
			await user.click(keywordInputEle);
			await user.type(keywordInputEle, 'test keyword');
			await user.click(screen.getByTestId('keywords-input'));
			await user.click(screen.getByRole('button', { name: /action\.search/i }));
			await waitFor(() => {
				expect(onSearchConfirm).toHaveBeenCalledWith(
					expect.objectContaining({
						query: [
							expect.objectContaining({ label: 'test keyword', isGeneric: true, hasAvatar: false })
						]
					})
				);
			});
			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it.each([
			[
				'from',
				'received-from-input',
				{ label: 'from:validEmail@test.com', value: 'from:validEmail@test.com' }
			],
			['to', 'sent-to-input', { label: 'to:validEmail@test.com', value: 'to:validEmail@test.com' }]
		])('adds "%s:" prefix to contact query entries', async (_, testId, expected) => {
			const onSearchConfirm = vi.fn();
			const { user } = setupTest(
				<AdvancedFilterModal {...defaultProps} onSearchConfirm={onSearchConfirm} />
			);
			await user.type(screen.getByTestId(testId), 'validEmail@test.com');
			await user.type(screen.getByTestId(testId), '[Enter]');
			await user.click(screen.getByText('action.search'));
			await waitFor(() => {
				expect(onSearchConfirm).toHaveBeenCalledWith({
					includeSharedFolders: false,
					query: [expect.objectContaining(expected)]
				});
			});
		});

		it('preserves previous query entries when adding a sent-to value', async () => {
			const onSearchConfirm = vi.fn();
			const query: SearchQueryItem = {
				id: 'someone@test.com',
				label: 'from:someone@test.com',
				value: 'from:someone@test.com'
			};
			const { user } = setupTest(
				<AdvancedFilterModal {...defaultProps} query={[query]} onSearchConfirm={onSearchConfirm} />
			);
			await user.type(screen.getByTestId('sent-to-input'), 'validEmail@test.com');
			await user.type(screen.getByTestId('sent-to-input'), '[Enter]');
			await user.click(screen.getByText('action.search'));
			await waitFor(() => {
				expect(onSearchConfirm).toHaveBeenCalledWith(
					expect.objectContaining({
						query: [
							expect.objectContaining({
								id: 'from:someone@test.com',
								label: 'from:someone@test.com',
								value: 'from:someone@test.com'
							}),
							expect.objectContaining({
								id: 'validEmail@test.com',
								label: 'to:validEmail@test.com',
								value: 'to:validEmail@test.com'
							})
						]
					})
				);
			});
		});

		it('includes attachment type in query', async () => {
			const onSearchConfirm = vi.fn();
			const { user } = setupTest(
				<AdvancedFilterModal {...defaultProps} onSearchConfirm={onSearchConfirm} />
			);
			await selectOption(user, 'attachmentTypeSelect', 'attachment_type.application');
			await user.click(screen.getByRole('button', { name: /action\.search/i }));
			await waitFor(() => {
				expect(onSearchConfirm).toHaveBeenCalledWith(
					expect.objectContaining({
						query: [expect.objectContaining({ value: 'attachment:application/*' })]
					})
				);
			});
		});

		it('includes email status in query', async () => {
			const onSearchConfirm = vi.fn();
			const { user } = setupTest(
				<AdvancedFilterModal {...defaultProps} onSearchConfirm={onSearchConfirm} />
			);
			await selectOption(user, 'emailStatusSelect', 'email_status.unread');
			await user.click(screen.getByRole('button', { name: /action\.search/i }));
			await waitFor(() => {
				expect(onSearchConfirm).toHaveBeenCalledWith(
					expect.objectContaining({
						query: [expect.objectContaining({ value: 'is:unread' })]
					})
				);
			});
		});
	});

	describe('reset button', () => {
		beforeEach(() => {
			(getTags as Mock).mockReturnValue(mockTags);
		});

		it('disables the search button when clicked', async () => {
			const query = [{ id: 'q1', label: 'keywords', value: 'some keywords' }];
			const { user } = setupTest(<AdvancedFilterModal {...defaultProps} query={query} />);
			const confirmButton = screen.getByRole('button', { name: /action\.search/i });
			const resetButton = screen.getByRole('button', { name: /action\.reset/i });
			expect(confirmButton).toBeEnabled();
			expect(resetButton).toBeEnabled();
			await user.click(resetButton);
			expect(confirmButton).toBeDisabled();
		});

		it.each<[string, (user: UserEvent) => Promise<void>]>([
			[
				'keyword',
				async (user): Promise<void> => {
					const el = within(screen.getByTestId('keywords-input')).getByRole('textbox');
					await user.type(el, 'x');
					await user.type(el, '[Enter]');
				}
			],
			[
				'subject',
				async (user): Promise<void> => {
					const el = within(screen.getByTestId('subject-input')).getByRole('textbox');
					await user.type(el, 'x');
					await user.type(el, '[Enter]');
				}
			],
			[
				'received from',
				async (user): Promise<void> => {
					const el = screen.getByTestId('received-from-input');
					await user.type(el, 'validEmail2@test.com');
					await user.type(el, '[Enter]');
				}
			],
			[
				'sent to',
				async (user): Promise<void> => {
					const el = screen.getByTestId('sent-to-input');
					await user.type(el, 'validEmail@test.com');
					await user.type(el, '[Enter]');
				}
			],
			[
				'attachment type',
				async (user): Promise<void> => {
					await selectOption(user, 'attachmentTypeSelect', 'attachment_type.application');
				}
			],
			[
				'email status',
				async (user): Promise<void> => {
					await selectOption(user, 'emailStatusSelect', 'email_status.unread');
				}
			],
			[
				'sent before date',
				async (user): Promise<void> => {
					await user.type(
						screen.getByPlaceholderText('search.sent_before'),
						format(new Date(42424242), 'MM/dd/yyyy HH:mm')
					);
					await user.tab();
				}
			],
			[
				'sent after date',
				async (user): Promise<void> => {
					await user.type(
						screen.getByPlaceholderText('search.sent_after'),
						format(new Date(42424242), 'MM/dd/yyyy HH:mm')
					);
					await user.tab();
				}
			],
			[
				'size smaller than',
				async (user): Promise<void> => {
					const el = within(screen.getByTestId('sizeSmallerInput')).getByRole('textbox');
					await user.type(el, '1');
					await user.type(el, '[Enter]');
				}
			],
			[
				'size larger than',
				async (user): Promise<void> => {
					const el = within(screen.getByTestId('sizeLargerInput')).getByRole('textbox');
					await user.type(el, '1');
					await user.type(el, '[Enter]');
				}
			],
			[
				'has attachment toggle',
				async (user): Promise<void> => {
					await user.click(screen.getByTestId('hasAttachmentToggle'));
				}
			],
			[
				'is flagged toggle',
				async (user): Promise<void> => {
					await user.click(screen.getByTestId('isFlaggedToggle'));
				}
			],
			[
				'unread toggle',
				async (user): Promise<void> => {
					await user.click(screen.getByTestId('isUnreadToggle'));
				}
			],
			[
				'tags',
				async (user): Promise<void> => {
					await user.click(screen.getByTestId('tagInput'));
					await user.click(screen.getAllByTestId('dropdown-item')[0]);
				}
			]
		])('resets %s when pressed', async (_, setup) => {
			const { user } = setupTest(<AdvancedFilterModal {...defaultProps} />);
			await setup(user);
			const confirmButton = screen.getByRole('button', { name: /action\.search/i });
			const resetButton = screen.getByRole('button', { name: /action\.reset/i });
			expect(confirmButton).toBeEnabled();
			expect(resetButton).toBeEnabled();
			await user.click(resetButton);
			await waitFor(() => {
				expect(confirmButton).toBeDisabled();
			});
			expect(resetButton).toBeDisabled();
		});

		it.skip('resets "Is contained in" folder when pressed', async () => {
			const folderName = 'random-inbox';
			populateFoldersStore({
				customFolders: [generateFolder({ id: '222', name: folderName })]
			});
			const { user } = setupTest(<AdvancedFilterModal {...defaultProps} />);
			const openFolderDialogButton = within(screen.getByTestId('folderInput')).getByTestId(
				'icon: FolderOutline'
			);
			await user.click(openFolderDialogButton);

			act(() => {
				vi.advanceTimersByTime(TIMERS.modal_open_delay);
			});

			await user.click(screen.getByText(folderName));
			await user.click(screen.getByRole('button', { name: 'label.choose_folder' }));

			const confirmButton = screen.getByRole('button', { name: /action\.search/i });
			const resetButton = screen.getByRole('button', { name: /action\.reset/i });
			expect(confirmButton).toBeEnabled();
			expect(resetButton).toBeEnabled();
			await user.click(resetButton);
			await waitFor(() => {
				expect(confirmButton).toBeDisabled();
			});
			expect(resetButton).toBeDisabled();
		});

		it('resets the shared folder toggle when pressed', async () => {
			const { user } = setupTest(<AdvancedFilterModal {...defaultProps} />);
			await user.click(screen.getByTestId('isSharedFolderIncludedToggle'));
			const confirmButton = screen.getByRole('button', { name: /action\.search/i });
			const resetButton = screen.getByRole('button', { name: /action\.reset/i });
			expect(confirmButton).toBeDisabled();
			expect(resetButton).toBeEnabled();
			await user.click(resetButton);
			await waitFor(() => {
				expect(confirmButton).toBeDisabled();
			});
			expect(resetButton).toBeDisabled();
		});
	});

	describe('duplicate prevention', () => {
		it('prevents adding the same keyword twice', async () => {
			const onSearchConfirm = vi.fn();
			const { user } = setupTest(
				<AdvancedFilterModal {...defaultProps} onSearchConfirm={onSearchConfirm} />
			);
			const keywordInputEle = within(screen.getByTestId('keywords-input')).getByRole('textbox');
			await user.click(keywordInputEle);
			await user.type(keywordInputEle, 'test keyword');
			await user.type(keywordInputEle, '[Enter]');
			await user.clear(keywordInputEle);
			await user.type(keywordInputEle, 'test keyword');
			await user.type(keywordInputEle, '[Enter]');
			await user.click(screen.getByRole('button', { name: /action\.search/i }));
			await waitFor(() => {
				expect(onSearchConfirm).toHaveBeenCalledWith({
					includeSharedFolders: false,
					query: [{ hasAvatar: false, isGeneric: true, label: 'test keyword' }]
				});
			});
		});

		it.each([
			[
				'attachment type',
				async (user: UserEvent): Promise<void> => {
					await selectOption(user, 'attachmentTypeSelect', 'attachment_type.application');
					await selectOption(user, 'attachmentTypeSelect', 'attachment_type.application');
				},
				{
					isQueryFilter: true,
					label: 'Attachment:attachment_type.application',
					value: 'attachment:application/*'
				}
			],
			[
				'email status',
				async (user: UserEvent): Promise<void> => {
					await selectOption(user, 'emailStatusSelect', 'email_status.unread');
					await selectOption(user, 'emailStatusSelect', 'email_status.unread');
				},
				{ isQueryFilter: true, label: 'Is:email_status.unread', value: 'is:unread' }
			],
			[
				'tag',
				async (user: UserEvent): Promise<void> => {
					const tagInput = screen.getByTestId('tagInput');
					await user.click(tagInput);
					await user.click(screen.getAllByTestId('dropdown-item')[0]);
					await user.click(tagInput);
					await user.click(screen.getAllByTestId('dropdown-item')[0]);
				},
				{ isQueryFilter: true, label: 'tag:Tagged', value: 'tag:"Tagged"' }
			]
		])('prevents adding the same %s twice', async (_, setup, expectedItem) => {
			(getTags as Mock).mockReturnValue(mockTags);
			const onSearchConfirm = vi.fn();
			const { user } = setupTest(
				<AdvancedFilterModal {...defaultProps} onSearchConfirm={onSearchConfirm} query={[]} />
			);
			await setup(user);
			await user.click(screen.getByRole('button', { name: /action\.search/i }));
			await waitFor(() => {
				expect(onSearchConfirm).toHaveBeenCalledWith(
					expect.objectContaining({
						query: [expect.objectContaining(expectedItem)]
					})
				);
			});
		});
	});

	describe('shared folder toggle', () => {
		it('resets to initial state when modal is closed without confirming search', async () => {
			const { user, rerender } = setupTest(<AdvancedFilterModal {...defaultProps} />);
			const toggle = screen.getByTestId('isSharedFolderIncludedToggle');
			expect(within(toggle).getByTestId('icon: ToggleLeftOutline')).toBeInTheDocument();
			await user.click(toggle);
			expect(within(toggle).getByTestId('icon: ToggleRight')).toBeInTheDocument();
			await user.click(screen.getByTestId('icon: Close'));
			rerender(<AdvancedFilterModal {...defaultProps} />);
			await waitFor(() => {
				expect(
					within(screen.getByTestId('isSharedFolderIncludedToggle')).getByTestId(
						'icon: ToggleLeftOutline'
					)
				).toBeInTheDocument();
			});
		});

		it('preserves toggled state after confirming search', async () => {
			const onSearchConfirm = vi.fn();
			const query = [{ id: 'q1', label: 'keywords', value: 'keyword' }];
			const props: AdvancedFilterModalProps = { ...defaultProps, onSearchConfirm, query };
			const { user, rerender } = setupTest(<AdvancedFilterModal {...props} />);
			const toggle = screen.getByTestId('isSharedFolderIncludedToggle');
			await user.click(toggle);
			expect(within(toggle).getByTestId('icon: ToggleRight')).toBeInTheDocument();
			await user.click(screen.getByRole('button', { name: /action\.search/i }));
			expect(onSearchConfirm).toHaveBeenCalledWith(
				expect.objectContaining({ includeSharedFolders: true })
			);
			rerender(<AdvancedFilterModal {...props} />);
			await waitFor(() => {
				expect(
					within(screen.getByTestId('isSharedFolderIncludedToggle')).getByTestId(
						'icon: ToggleRight'
					)
				).toBeInTheDocument();
			});
		});
	});

	describe('contact input', () => {
		beforeEach(() => {
			const valueToAdd = generateMockContactInputItem();
			valueToAdd.actions = [EDIT_ACTION];
			(useContactInput as Mock).mockReturnValue(generateMockedContactInput(valueToAdd));
		});

		it('strips edit action from query chips for "to" and "from" fields', async () => {
			const onSearchConfirm = vi.fn();
			const { user } = setupTest(
				<AdvancedFilterModal {...defaultProps} onSearchConfirm={onSearchConfirm} />
			);
			await user.type(screen.getByTestId('sent-to-input'), 'validEmail@test.com');
			await user.type(screen.getByTestId('sent-to-input'), '[Enter]');
			await user.type(screen.getByTestId('received-from-input'), 'validEmail2@test.com');
			await user.type(screen.getByTestId('received-from-input'), '[Enter]');
			await user.click(screen.getByText('action.search'));
			await waitFor(() => {
				expect(onSearchConfirm).toHaveBeenCalledWith(
					expect.objectContaining({
						query: [
							expect.objectContaining({ actions: [] }),
							expect.objectContaining({ actions: [] })
						]
					})
				);
			});
		});

		it('displays edit action in "to" and "from" contact input chips', async () => {
			const { user } = setupTest(<AdvancedFilterModal {...defaultProps} />);
			await user.type(screen.getByTestId('sent-to-input'), 'validEmail@test.com');
			await user.type(screen.getByTestId('sent-to-input'), '[Enter]');
			await user.type(screen.getByTestId('received-from-input'), 'validEmail2@test.com');
			await user.type(screen.getByTestId('received-from-input'), '[Enter]');
			await user.click(screen.getByText('action.search'));
			const mockContactInputValues = await screen.findAllByTestId('mockedContactValue');
			expect(mockContactInputValues[0]).toHaveTextContent(/"icon":"EditOutline"/);
			expect(mockContactInputValues[1]).toHaveTextContent(/"icon":"EditOutline"/);
		});
	});
});
