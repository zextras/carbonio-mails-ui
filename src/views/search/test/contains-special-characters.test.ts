/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { containsSpecialCharacters } from '../search-view';

describe('containsSpecialCharacters', () => {
	describe('should return false for excluded prefixes', () => {
		it('should return false for attachment prefix', () => {
			expect(containsSpecialCharacters('attachment:test')).toBe(false);
			expect(containsSpecialCharacters('attachment:file.pdf')).toBe(false);
			expect(containsSpecialCharacters('attachment:documents/with/slashes')).toBe(false);
		});

		it('should return false for in prefix', () => {
			expect(containsSpecialCharacters('in:folder-with-dashes')).toBe(false);
			expect(containsSpecialCharacters('in:"/Inbox"')).toBe(false);
			expect(containsSpecialCharacters('in:"tr%sh"')).toBe(false);
		});

		it('should return false for before prefix', () => {
			expect(containsSpecialCharacters('before:2024-01-01')).toBe(false);
			expect(containsSpecialCharacters('before:06/10/2025')).toBe(false);
			expect(containsSpecialCharacters('before:yesterday')).toBe(false);
		});

		it('should return false for after prefix', () => {
			expect(containsSpecialCharacters('after:2024-01-01')).toBe(false);
			expect(containsSpecialCharacters('after:06/10/2025')).toBe(false);
			expect(containsSpecialCharacters('after:yesterday')).toBe(false);
		});
	});

	describe('should return true for other prefixes with special characters', () => {
		it('should return true for has prefix with special characters', () => {
			expect(containsSpecialCharacters('has:attachment!')).toBe(true);
			expect(containsSpecialCharacters('has:file-with-dash')).toBe(true);
			expect(containsSpecialCharacters('has:document_with_underscore')).toBe(true);
		});

		it('should return true for is prefix with special characters', () => {
			expect(containsSpecialCharacters('is:read!')).toBe(true);
			expect(containsSpecialCharacters('is:unread-with-dash')).toBe(true);
			expect(containsSpecialCharacters('is:flagged_with_underscore')).toBe(true);
		});

		it('should return true for Subject prefix with special characters', () => {
			expect(containsSpecialCharacters('Subject:important!')).toBe(true);
			expect(containsSpecialCharacters('Subject:meeting-with-dash')).toBe(true);
			expect(containsSpecialCharacters('Subject:report_with_underscore')).toBe(true);
		});

		it('should return true for from prefix with special characters', () => {
			expect(containsSpecialCharacters('from:user!@domain.com')).toBe(true);
			expect(containsSpecialCharacters('from:user-with-dash@domain.com')).toBe(true);
			expect(containsSpecialCharacters('from:user_with_underscore@domain.com')).toBe(true);
		});

		it('should return true for to prefix with special characters', () => {
			expect(containsSpecialCharacters('to:user!@domain.com')).toBe(true);
			expect(containsSpecialCharacters('to:user-with-dash@domain.com')).toBe(true);
			expect(containsSpecialCharacters('to:user_with_underscore@domain.com')).toBe(true);
		});

		it('should return true for smaller prefix with special characters', () => {
			expect(containsSpecialCharacters('smaller:10!MB')).toBe(true);
			expect(containsSpecialCharacters('smaller:10-with-dash')).toBe(true);
			expect(containsSpecialCharacters('smaller:10_with_underscore')).toBe(true);
		});

		it('should return true for larger prefix with special characters', () => {
			expect(containsSpecialCharacters('larger:10!MB')).toBe(true);
			expect(containsSpecialCharacters('larger:10-with-dash')).toBe(true);
			expect(containsSpecialCharacters('larger:10_with_underscore')).toBe(true);
		});

		it('should return true for tag prefix with special characters', () => {
			expect(containsSpecialCharacters('tag:important!')).toBe(true);
			expect(containsSpecialCharacters('tag:work-with-dash')).toBe(true);
			expect(containsSpecialCharacters('tag:personal_with_underscore')).toBe(true);
		});
	});

	describe('should return false for other prefixes without special characters', () => {
		it('should return false for has prefix without special characters', () => {
			expect(containsSpecialCharacters('has:attachment')).toBe(false);
			expect(containsSpecialCharacters('has:file')).toBe(false);
			expect(containsSpecialCharacters('has:document')).toBe(false);
		});

		it('should return false for is prefix without special characters', () => {
			expect(containsSpecialCharacters('is:read')).toBe(false);
			expect(containsSpecialCharacters('is:unread')).toBe(false);
			expect(containsSpecialCharacters('is:flagged')).toBe(false);
		});

		it('should return false for Subject prefix without special characters', () => {
			expect(containsSpecialCharacters('Subject:important')).toBe(false);
			expect(containsSpecialCharacters('Subject:meeting')).toBe(false);
			expect(containsSpecialCharacters('Subject:report')).toBe(false);
		});

		it('should return false for from prefix without special characters', () => {
			expect(containsSpecialCharacters('from:user@domain.com')).toBe(false);
			expect(containsSpecialCharacters('from:test@example.com')).toBe(false);
		});

		it('should return false for to prefix without special characters', () => {
			expect(containsSpecialCharacters('to:user@domain.com')).toBe(false);
			expect(containsSpecialCharacters('to:test@example.com')).toBe(false);
		});

		it('should return false for smaller prefix without special characters', () => {
			expect(containsSpecialCharacters('smaller:10MB')).toBe(false);
			expect(containsSpecialCharacters('smaller:100')).toBe(false);
		});

		it('should return false for larger prefix without special characters', () => {
			expect(containsSpecialCharacters('larger:10MB')).toBe(false);
			expect(containsSpecialCharacters('larger:100')).toBe(false);
		});

		it('should return false for tag prefix without special characters', () => {
			expect(containsSpecialCharacters('tag:important')).toBe(false);
			expect(containsSpecialCharacters('tag:work')).toBe(false);
			expect(containsSpecialCharacters('tag:personal')).toBe(false);
		});
	});

	describe('should handle values without prefixes', () => {
		it('should return true for values with special characters and no prefix', () => {
			expect(containsSpecialCharacters('test!')).toBe(true);
			expect(containsSpecialCharacters('file-with-dash')).toBe(true);
			expect(containsSpecialCharacters('document_with_underscore')).toBe(true);
			expect(containsSpecialCharacters('user@domain.com')).toBe(false);
			expect(containsSpecialCharacters('path/to/file')).toBe(true);
		});

		it('should return false for values without special characters and no prefix', () => {
			expect(containsSpecialCharacters('test')).toBe(false);
			expect(containsSpecialCharacters('file')).toBe(false);
			expect(containsSpecialCharacters('document')).toBe(false);
			expect(containsSpecialCharacters('user')).toBe(false);
			expect(containsSpecialCharacters('path')).toBe(false);
		});
	});

	describe('should handle edge cases', () => {
		it('should handle empty string', () => {
			expect(containsSpecialCharacters('')).toBe(false);
		});

		it('should handle string with only prefix and colon', () => {
			expect(containsSpecialCharacters('has:')).toBe(false);
			expect(containsSpecialCharacters('is:')).toBe(false);
			expect(containsSpecialCharacters('attachment:')).toBe(false);
		});

		it('should handle case sensitivity', () => {
			expect(containsSpecialCharacters('HAS:test')).toBe(true);
			expect(containsSpecialCharacters('Has:test')).toBe(true);
			expect(containsSpecialCharacters('has:TEST!')).toBe(true);
		});

		it('should handle partial prefix matches', () => {
			expect(containsSpecialCharacters('hasattachment:test')).toBe(true);
			expect(containsSpecialCharacters('hasattachment:test!')).toBe(true);
		});

		it('should handle undefined prefix (no matching prefix)', () => {
			expect(containsSpecialCharacters('unknownprefix')).toBe(false);
			expect(containsSpecialCharacters('randomvalue')).toBe(false);
			expect(containsSpecialCharacters('customtext')).toBe(false);
			expect(containsSpecialCharacters('unknown:test')).toBe(true);
			expect(containsSpecialCharacters('random:file-with-dash')).toBe(true);
			expect(containsSpecialCharacters('custom:document_with_underscore')).toBe(true);
			expect(containsSpecialCharacters('other:path/to/file')).toBe(true);
		});

		it('should handle multiple special characters', () => {
			expect(containsSpecialCharacters('test!@#$%')).toBe(true);
			expect(containsSpecialCharacters('file-with_underscore!')).toBe(true);
			expect(containsSpecialCharacters('path/to/file-with-dash')).toBe(true);
		});

		it('should handle special characters at different positions', () => {
			expect(containsSpecialCharacters('!test')).toBe(true);
			expect(containsSpecialCharacters('test!')).toBe(true);
			expect(containsSpecialCharacters('te!st')).toBe(true);
		});
	});

	describe('should test all special characters', () => {
		it('should detect all special characters in the array', () => {
			const specialChars = [
				'~',
				"'",
				'!',
				'#',
				'$',
				'%',
				'^',
				'&',
				'(',
				')',
				'_',
				'?',
				'/',
				'{',
				'}',
				'[',
				']',
				';',
				':',
				'-',
				'+',
				'<',
				'>'
			];

			specialChars.forEach((char) => {
				expect(containsSpecialCharacters(`test${char}value`)).toBe(true);
			});
		});

		it('should not detect special characters in excluded prefixes', () => {
			const specialChars = [
				'~',
				"'",
				'!',
				'#',
				'$',
				'%',
				'^',
				'&',
				'(',
				')',
				'_',
				'?',
				'/',
				'{',
				'}',
				'[',
				']',
				';',
				':',
				'-',
				'+',
				'<',
				'>'
			];

			specialChars.forEach((char) => {
				expect(containsSpecialCharacters(`attachment:test${char}value`)).toBe(false);
				expect(containsSpecialCharacters(`in:test${char}value`)).toBe(false);
				expect(containsSpecialCharacters(`before:test${char}value`)).toBe(false);
				expect(containsSpecialCharacters(`after:test${char}value`)).toBe(false);
			});
		});
	});

	describe('should test all prefixes', () => {
		it('should handle all prefixes correctly', () => {
			expect(containsSpecialCharacters('attachment:test!')).toBe(false);
			expect(containsSpecialCharacters('in:test!')).toBe(false);
			expect(containsSpecialCharacters('before:test!')).toBe(false);
			expect(containsSpecialCharacters('after:test!')).toBe(false);

			expect(containsSpecialCharacters('has:test!')).toBe(true);
			expect(containsSpecialCharacters('is:test!')).toBe(true);
			expect(containsSpecialCharacters('Subject:test!')).toBe(true);
			expect(containsSpecialCharacters('from:test!')).toBe(true);
			expect(containsSpecialCharacters('to:test!')).toBe(true);
			expect(containsSpecialCharacters('smaller:test!')).toBe(true);
			expect(containsSpecialCharacters('larger:test!')).toBe(true);
			expect(containsSpecialCharacters('tag:test!')).toBe(true);
		});
	});

	describe('should handle boolean values', () => {
		it('should return false for a boolean true input', () => {
			expect(containsSpecialCharacters(true)).toBe(false);
		});

		it('should return false for a boolean false input', () => {
			expect(containsSpecialCharacters(false)).toBe(false);
		});
	});
});
