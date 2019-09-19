## Contributing

### Questions, Bugs, Enhancements / Suggestions

For questions, bug reports, and enhancement requests / suggestions, please use the GitHub issue 
tracker at https://github.com/ericblade/quagga2/issues

### Chat / Real Time Communication?

We have a Gitter chat channel available at https://gitter.im/quaggaJS/Lobby . Please join us there,
and be patient.  Thanks!

### Code

#### Developing enhancements to Quagga2

If you'd like to work directly on the Quagga2 code, it is quite easy to build a local development
copy and get started hacking on the base code.  Simply clone this repository, then run:

```
npm install
npm run build
```

#### Running tests

There are several tests included in Quagga2, in the test/ folder.  Please make sure before you
send in any pull requests, that you have run ```npm test``` against the existing tests, as well as
implemented any tests that may be needed to test your new code.  If you're not sure how to properly 
unit test your new code, then go ahead and make that pull request, and we'll try to help you before
merging.

#### Working on a changed copy of Quagga2 from another repository (ie, developing an external plugin)

If you need to make changes to Quagga2 to support some external code (such as an external reader plugin),
you will probably need to be able to test the code in your other repo.  One such way to do that is
to ```npm install @ericblade/quagga2``` inside the external repo, which will initialize the module
structure, and fill it with the current release of quagga2.  Once that is completed, then copy the
lib/quagga.js (node) and/or dist/quagga.js and/or dist/quagga.min.js files into 
ExternalRepo/node_modules/@ericblade/quagga2, preserving the "lib" or "dist" folder. Then your code
will have the new changes that you have implemented in your copy of the quagga2 repo.

#### Pull requests

Please, submit pull requests! Open source works best when we all work together.  If you find a change
to be useful, the odds are that other users will, as well!

## BE AWESOME

Don't forget to BE AWESOME.

