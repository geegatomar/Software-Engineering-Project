// const {
//     get_home
// } = include('../app_testable.js')
const {
    get_home
} = require("../app_testable");


describe("Test Handler", function () {
    test("responds to /", () => {
        const req = {};
        const res = {
            text: '',
            send: function (input) {
                this.text = input
            }
        };
        get_home(req, res);
        expect(res.text).toEqual("home");
    });

    // test("responds to /register", async () => {
    //     const req = {
    //         body: {
    //             recruiter_or_seeker: 'seeker',
    //             organization: 'NITK',
    //             username: 'shiv@gmail.com',
    //             password: 'shiva'
    //         }
    //     };
    //     const res = {
    //         text: '',
    //         send: function (input) {
    //             this.text = input
    //         }
    //     };
    //     post_register(req, res);

    //     expect(res.text).toEqual("User with this username already exists");
    // });


});