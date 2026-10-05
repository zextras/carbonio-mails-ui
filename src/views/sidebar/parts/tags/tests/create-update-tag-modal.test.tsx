/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { waitFor } from '@testing-library/react';
import { ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import type { CreateTagRequest, Tag, TagActionRequest } from '@zextras/carbonio-ui-commons';
import { http, HttpResponse } from 'msw';

import { getSetupServer } from '../../../../../__test__/vitest-setup';
import CreateUpdateTagModal from '../create-update-tag-modal';
import { screen, setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';

const TAG_CAPTION = 'Choose a color to make this tag easier to recognize';

/** Collects the `action` of every TagActionRequest sent (rename and color are sent separately). */
const interceptTagActions = (): Array<TagActionRequest['action']> => {
	const actions: Array<TagActionRequest['action']> = [];
	getSetupServer().use(
		http.post('/service/soap/TagActionRequest', async ({ request }) => {
			const body = (await request.json()) as { Body: { TagActionRequest: TagActionRequest } };
			actions.push(body.Body.TagActionRequest.action);
			return HttpResponse.json({ Body: { TagActionResponse: {} } });
		})
	);
	return actions;
};

describe('CreateUpdateTagModal', () => {
	describe('create mode', () => {
		it('shows the standard color swatches with the tag caption', () => {
			setupTest(<CreateUpdateTagModal onClose={vi.fn()} />);

			ZIMBRA_STANDARD_COLORS.forEach((color) => {
				expect(screen.getByRole('button', { name: color.zLabel })).toBeVisible();
			});
			expect(screen.getByText(TAG_CAPTION)).toBeVisible();
		});

		it('preselects the first standard color', () => {
			setupTest(<CreateUpdateTagModal onClose={vi.fn()} />);

			expect(
				screen.getByRole('button', { name: ZIMBRA_STANDARD_COLORS[0].zLabel })
			).toHaveAttribute('aria-pressed', 'true');
		});

		it('creates the tag with the selected standard color as rgb', async () => {
			const onClose = vi.fn();
			const createTagInterceptor = createSoapAPIInterceptor<CreateTagRequest, { tag: Array<Tag> }>(
				'CreateTag',
				{ tag: [{ id: '1', name: 'work' }] }
			);
			const { user } = setupTest(<CreateUpdateTagModal onClose={onClose} />);

			await user.type(screen.getByRole('textbox', { name: 'label.tag_name*' }), 'work');
			await user.click(screen.getByRole('button', { name: ZIMBRA_STANDARD_COLORS[5].zLabel }));
			await user.click(screen.getByRole('button', { name: 'label.create' }));

			const request = await createTagInterceptor;
			expect(request.tag).toEqual({ name: 'work', rgb: ZIMBRA_STANDARD_COLORS[5].hex });
			await waitFor(() => expect(onClose).toHaveBeenCalled());
		});

		it('creates the tag with a custom color chosen from the picker', async () => {
			const createTagInterceptor = createSoapAPIInterceptor<CreateTagRequest, { tag: Array<Tag> }>(
				'CreateTag',
				{ tag: [{ id: '1', name: 'work' }] }
			);
			const { user } = setupTest(<CreateUpdateTagModal onClose={vi.fn()} />);

			await user.type(screen.getByRole('textbox', { name: 'label.tag_name*' }), 'work');
			await user.click(screen.getByTestId('icon: PlusCircleOutline'));
			const hexInput = screen.getByRole('textbox', { name: 'Hex color' });
			await user.clear(hexInput);
			await user.type(hexInput, '#abcdef');
			await user.click(screen.getByRole('button', { name: 'Choose' }));
			await user.click(screen.getByRole('button', { name: 'label.create' }));

			const request = await createTagInterceptor;
			expect(request.tag).toEqual({ name: 'work', rgb: '#abcdef' });
		});

		it('disables the confirm button while the custom color picker is open', async () => {
			const { user } = setupTest(<CreateUpdateTagModal onClose={vi.fn()} />);

			await user.type(screen.getByRole('textbox', { name: 'label.tag_name*' }), 'work');
			expect(screen.getByRole('button', { name: 'label.create' })).toBeEnabled();

			await user.click(screen.getByTestId('icon: PlusCircleOutline'));

			expect(screen.getByRole('button', { name: 'label.create' })).toBeDisabled();
		});

		it('close button is a no-op while the custom color picker is open', async () => {
			const onClose = vi.fn();
			const { user } = setupTest(<CreateUpdateTagModal onClose={onClose} />);

			await user.click(screen.getByTestId('icon: PlusCircleOutline'));
			await user.click(screen.getByTestId('icon: CloseOutline'));

			expect(onClose).not.toHaveBeenCalled();
		});

		it('close button calls onClose when the custom color picker is closed', async () => {
			const onClose = vi.fn();
			const { user } = setupTest(<CreateUpdateTagModal onClose={onClose} />);

			await user.click(screen.getByTestId('icon: CloseOutline'));

			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	describe('edit mode', () => {
		it('preselects the standard color of the tag', () => {
			setupTest(
				<CreateUpdateTagModal
					onClose={vi.fn()}
					editMode
					tag={{ id: '10', name: 'work', color: 3 }}
				/>
			);

			expect(
				screen.getByRole('button', { name: ZIMBRA_STANDARD_COLORS[3].zLabel })
			).toHaveAttribute('aria-pressed', 'true');
		});

		it('preselects the custom color of the tag', () => {
			setupTest(
				<CreateUpdateTagModal
					onClose={vi.fn()}
					editMode
					tag={{ id: '10', name: 'work', rgb: '#abcdef' }}
				/>
			);

			expect(screen.getByRole('button', { name: 'Custom color (#abcdef)' })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
		});

		it('renames the tag and saves the selected color as rgb', async () => {
			const tagActions = interceptTagActions();
			const { user } = setupTest(
				<CreateUpdateTagModal
					onClose={vi.fn()}
					editMode
					tag={{ id: '10', name: 'work', rgb: '#abcdef' }}
				/>
			);

			await user.click(screen.getByRole('button', { name: ZIMBRA_STANDARD_COLORS[2].zLabel }));
			await user.click(screen.getByRole('button', { name: 'label.edit' }));

			await waitFor(() => expect(tagActions).toHaveLength(2));
			expect(tagActions).toEqual(
				expect.arrayContaining([
					{ op: 'rename', id: '10', name: 'work' },
					{ op: 'color', id: '10', rgb: ZIMBRA_STANDARD_COLORS[2].hex }
				])
			);
		});
	});
});
